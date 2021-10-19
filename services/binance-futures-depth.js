const WebSocketClient = require('ws');

const redis = require('../libs/redis');

const log = require('../libs/logger');

const {
  sendMessage,
} = require('./telegram-bot');

const {
  getUnix,
} = require('../libs/support');

const Instrument = require('../models/Instrument');
const InstrumentTickBound = require('../models/InstrumentTickBound');

const instrumentsMapper = {};

const CONNECTION_NAME = 'Connection-Depth';

module.exports = async () => {
  const instrumentsDocs = await Instrument.find({
    // tmp
    name_futures: 'ZENUSDTPERP',

    is_active: true,
  }, {
    name_futures: 1,
  }).exec();

  if (!instrumentsDocs || !instrumentsDocs.length) {
    return true;
  }

  if (instrumentsDocs && instrumentsDocs.length > 140) {
    throw new Error(`${CONNECTION_NAME}: > 140 streams to binance`);
  }

  instrumentsDocs.forEach(doc => {
    instrumentsMapper[doc.name_futures] = {
      instrumentId: doc._id,

    };
  });

  let sendPongInterval;
  let connectStr = 'wss://fstream.binance.com/stream?streams=';

  instrumentsDocs.forEach(doc => {
    const cutName = doc.name_futures.toLowerCase().replace('perp', '');
    connectStr += `${cutName}@depth@500ms/`;
  });

  const websocketConnect = () => {
    const client = new WebSocketClient(connectStr);

    client.on('open', () => {
      log.info(`${CONNECTION_NAME} was opened`);
      sendMessage(260325716, `${CONNECTION_NAME} was opened`);

      sendPongInterval = setInterval(() => {
        client.send('pong');
      }, 1000 * 60); // 1 minute
    });

    client.on('ping', () => {
      client.send('pong');
    });

    client.on('close', message => {
      log.info(`${CONNECTION_NAME} was closed`);
      sendMessage(260325716, `${CONNECTION_NAME} was closed (${message})`);
      clearInterval(sendPongInterval);

      websocketConnect();
    });

    client.on('message', async bufferData => {
      const parsedData = JSON.parse(bufferData.toString());

      if (!parsedData.data || !parsedData.data.e) {
        console.log(`${CONNECTION_NAME}: ${parsedData}`, parsedData);
        return true;
      }

      const {
        data: {
          a: asks,
          b: bids,
          s: instrumentName,
        },
      } = parsedData;

      let cacheDocAsks = await redis.getAsync(`INSTRUMENT:${instrumentName}PERP:DEPTH:ASKS`);
      let cacheDocBids = await redis.getAsync(`INSTRUMENT:${instrumentName}PERP:DEPTH:BIDS`);

      if (!cacheDocAsks) {
        cacheDocAsks = [];
      } else {
        cacheDocAsks = JSON.parse(cacheDocAsks);
      }

      if (!cacheDocBids) {
        cacheDocBids = [];
      } else {
        cacheDocBids = JSON.parse(cacheDocBids);
      }

      asks.forEach(([
        price, quantity,
      ]) => {
        price = parseFloat(price);
        quantity = parseFloat(quantity);

        if (quantity === 0) {
          cacheDocAsks = cacheDocAsks.filter(elem => elem.price !== price);
          return true;
        }

        const doesExistPrice = cacheDocAsks.find(
          elem => elem.price === price,
        );

        if (!doesExistPrice) {
          cacheDocAsks.push({ price, quantity });
        } else {
          doesExistPrice.quantity = quantity;
        }
      });

      bids.forEach(([
        price, quantity,
      ]) => {
        price = parseFloat(price);
        quantity = parseFloat(quantity);

        if (quantity === 0) {
          cacheDocBids = cacheDocBids.filter(elem => elem.price !== price);
          return true;
        }

        const doesExistPrice = cacheDocBids.find(
          elem => elem.price === price,
        );

        if (!doesExistPrice) {
          cacheDocBids.push({ price, quantity });
        } else {
          doesExistPrice.quantity = quantity;
        }
      });

      await redis.setAsync([
        `INSTRUMENT:${instrumentName}PERP:DEPTH:ASKS`,
        JSON.stringify(cacheDocAsks),
      ]);

      await redis.setAsync([
        `INSTRUMENT:${instrumentName}PERP:DEPTH:BIDS`,
        JSON.stringify(cacheDocBids),
      ]);
    });
  };

  websocketConnect();
};
