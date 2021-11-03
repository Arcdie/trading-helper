const WebSocketClient = require('ws');

const log = require('../../../libs/logger');

const {
  sendMessage,
} = require('../../telegram-bot');

const {
  sendData,
} = require('../../../websocket/websocket-server');

const {
  create5mCandle,
} = require('../../../controllers/candles/utils/create-5m-candle');

const {
  updateInstrumentInRedis,
} = require('../../../controllers/instruments/utils/update-instrument-in-redis');

const {
  calculateAverageVolumeForLast15Minutes,
} = require('../../../controllers/instruments/utils/calculate-average-volume-for-last-15-minutes');

const CONNECTION_NAME = 'Spot:Kline_5m';

module.exports = async (instrumentsDocs = []) => {
  try {
    if (!instrumentsDocs || !instrumentsDocs.length) {
      return true;
    }

    let sendPongInterval;
    let connectStr = 'wss://stream.binance.com/stream?streams=';

    instrumentsDocs.forEach(doc => {
      const cutName = doc.name.toLowerCase();
      connectStr += `${cutName}@kline_5m/`;
    });

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

        if (!parsedData.data || !parsedData.data.s) {
          log.warn(`${CONNECTION_NAME}: ${JSON.stringify(parsedData)}`);
          return true;
        }

        const {
          data: {
            s: instrumentName,
            E: eventTimeUnix,
            k: {
              t: startTime,
              T: closeTime,
              o: open,
              c: close,
              h: high,
              l: low,
              v: volume,
              x: isClosed,
            },
          },
        } = parsedData;

        const resultUpdateInstrument = await updateInstrumentInRedis({
          instrumentName,
          price: parseFloat(close),
        });

        const instrumentDoc = resultUpdateInstrument.result;

        if (isClosed) {
          await create5mCandle({
            isFutures: false,
            instrumentId: instrumentDoc._id,
            startTime: new Date(startTime),
            open,
            close,
            high,
            low,
            volume,
          });

          await calculateAverageVolumeForLast15Minutes({
            instrumentId: instrumentDoc._id,
            instrumentName: instrumentDoc.name,
          });
        }

        sendData({
          actionName: 'newSpotInstrumentPrice',
          data: {
            instrumentName,
            newPrice: close,
          },
        });
      });
    };

    websocketConnect();
  } catch (error) {
    console.log(error);
    return false;
  }
};
