const WebSocketClient = require('ws');

const log = require('../libs/logger');

const {
  checkCrossing,
} = require('../controllers/user-level-bounds/utils/check-crossing');

const {
  sendData,
} = require('./websocket-server');

const Instrument = require('../models/Instrument');

const instrumentsMapper = {};

module.exports = async () => {
  const instrumentsDocs = await Instrument.find({
    is_active: true,
  }, {
    name_futures: 1,
  }).exec();

  if (instrumentsDocs && instrumentsDocs.length > 140) {
    throw new Error('> 140 streams to binance');
  }

  log.info(`Count instruments: ${instrumentsDocs.length}`);

  instrumentsDocs.forEach(doc => {
    instrumentsMapper[doc.name_futures] = {
      instrumentId: doc._id,
      askPrice: 0,
      bidPrice: 0,
      lastUpdate: getUnix(),
    };
  });

  let sendPongInterval;
  let checkCrossingInterval;
  let connectStr = 'wss://fstream.binance.com/stream?streams=';

  instrumentsDocs.forEach(doc => {
    const cutName = doc.name_futures.toLowerCase().replace('perp', '');
    connectStr += `${cutName}@bookTicker/`;
  });

  // connectStr += 'ctkusdt@bookTicker';

  let client = new WebSocketClient(connectStr);

  client.on('open', () => {
    log.info('Connection is opened');

    sendPongInterval = setInterval(() => {
      client.send('pong');
    }, 1000 * 60); // 1 minute

    checkCrossingInterval = setInterval(async () => {
      await Promise.all(
        Object
          .keys(instrumentsMapper)
          .map(async instrumentName => {
            const {
              bidPrice,
              askPrice,
              instrumentId,
            } = instrumentsMapper[instrumentName];

            if (bidPrice && askPrice) {
              const resultCheck = await checkCrossing({
                instrumentId,
                instrumentName,
                bidPrice: parseFloat(bidPrice),
                askPrice: parseFloat(askPrice),
              });
            }
          }));
    }, 1000 * 10); // 10 seconds
  });

  client.on('ping', () => {
    client.send('pong');
  });

  client.on('close', (message) => {
    log.info('Connection is closed');
    clearInterval(sendPongInterval);
    clearInterval(checkCrossingInterval);

    client = {};
    client = new WebSocketClient(connectStr);
  });

  client.on('message', async bufferData => {
    const parsedData = JSON.parse(bufferData.toString());

    if (!parsedData.data || !parsedData.data.e) {
      console.log('parsedData', parsedData);
      return true;
    }

    const {
      data: {
        e: actionName,
        s: instrumentName,
        b: bidPrice,
        a: askPrice,
      },
    } = parsedData;

    const instrumentObj = instrumentsMapper[`${instrumentName}PERP`];

    instrumentObj.bidPrice = bidPrice;
    instrumentObj.askPrice = askPrice;

    const nowUnix = getUnix();
    const instrumentLastUpdateUnix = instrumentObj.lastUpdate;

    if (Math.abs(nowUnix - instrumentLastUpdateUnix) >= 60) {
      instrumentObj.lastUpdate = nowUnix;

      await Instrument.findOneAndUpdate({
        name_futures: `${instrumentName}PERP`,
      }, {
        price: askPrice,
        updated_at: new Date(),
      }).exec();
    }

    sendData({
      actionName: 'newPrice',
      instrumentName: `${instrumentName}PERP`,
      newPrice: askPrice,
    });
  });
};

const getUnix = () => parseInt(new Date().getTime() / 1000, 10);
