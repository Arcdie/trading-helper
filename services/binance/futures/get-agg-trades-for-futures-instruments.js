const WebSocketClient = require('ws');

const log = require('../../../libs/logger')(module);

const {
  sendMessage,
} = require('../../telegram-bot');

const {
  createTrade,
} = require('../../../controllers/trades/utils/create-trade');

const {
  getInstrumentRobotBounds,
} = require('../../../controllers/instrument-robot-bounds/utils/get-instrument-robot-bounds');

const CONNECTION_NAME = 'Futures:aggTrade';

module.exports = async (instrumentsDocs = []) => {
  try {
    if (!instrumentsDocs || !instrumentsDocs.length) {
      return true;
    }

    let sendPongInterval;
    let connectStr = 'wss://fstream.binance.com/stream?streams=';

    for (const doc of instrumentsDocs) {
      const resultGetInstrumentRobotBounds = await getInstrumentRobotBounds({
        instrumentId: doc._id,
      });

      if (!resultGetInstrumentRobotBounds || !resultGetInstrumentRobotBounds.status) {
        log.warn(resultGetInstrumentRobotBounds.message || 'Cant getInstrumentRobotBounds');
        continue;
      }

      if (!resultGetInstrumentRobotBounds.result || !resultGetInstrumentRobotBounds.result.length) {
        continue;
      }

      doc.instrument_robot_bounds = resultGetInstrumentRobotBounds.result;

      const cutName = doc.name.toLowerCase().replace('perp', '');
      connectStr += `${cutName}@aggTrade/`;
    }

    connectStr = connectStr.substring(0, connectStr.length - 1);

    const websocketConnect = () => {
      const client = new WebSocketClient(connectStr);

      client.on('open', () => {
        log.info(`${CONNECTION_NAME} was opened`);

        sendPongInterval = setInterval(() => {
          client.pong();
        }, 1000 * 60); // 1 minute
      });

      client.on('ping', () => {
        client.pong();
      });

      client.on('close', (message) => {
        log.info(`${CONNECTION_NAME} was closed`);

        if (message !== 1006) {
          sendMessage(260325716, `${CONNECTION_NAME} was closed (${message})`);
        }

        clearInterval(sendPongInterval);
        websocketConnect();
      });

      client.on('message', async bufferData => {
        const parsedData = JSON.parse(bufferData.toString());

        if (!parsedData.data || !parsedData.data.q) {
          log.warn(`${CONNECTION_NAME}: ${JSON.stringify(parsedData)}`);
          return true;
        }

        const {
          data: {
            s: instrumentName,
            q: quantity,
            p: price,
            m: direction,
            T: tradeTime,
          },
        } = parsedData;

        const isLong = (direction === false);
        const validQuantity = parseFloat(quantity);
        const validInstrumentName = `${instrumentName}PERP`;
        const targetInstrument = instrumentsDocs.find(doc => doc.name === validInstrumentName);

        const doesExistBound = targetInstrument.instrument_robot_bounds.some(
          bound => bound.quantity === validQuantity && bound.is_long === isLong,
        );

        if (doesExistBound) {
          const resultCreateTrade = await createTrade({
            instrumentId: targetInstrument._id,
            price: parseFloat(price),
            quantity: validQuantity,
            isLong,
            time: new Date(tradeTime),
          });

          if (!resultCreateTrade || !resultCreateTrade.status) {
            log.warn(resultCreateTrade.message || 'Cant createTrade');
          }
        }
      });
    };

    websocketConnect();
  } catch (error) {
    console.log(error);
    return false;
  }
};
