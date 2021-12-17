const WebSocketClient = require('ws');

const log = require('../../../libs/logger')(module);

const {
  sendMessage,
} = require('../../telegram-bot');

const {
  sendData,
} = require('../../../websocket/websocket-server');

const {
  updateCandlesInRedis,
} = require('../../../controllers/candles/utils/update-candles-in-redis');

const {
  updateInstrumentInRedis,
} = require('../../../controllers/instruments/utils/update-instrument-in-redis');

const {
  checkUserLevelBounds,
} = require('../../../controllers/user-level-bounds/utils/check-user-level-bounds');

const {
  calculateTrendFor5mTimeframe,
} = require('../../../controllers/instrument-trends/utils/calculate-trend-for-5m-timeframe');

const {
  binanceScreenerConf: { port },
} = require('../../../config');

const {
  ACTION_NAMES,
} = require('../../../websocket/constants');

const {
  INTERVALS,
} = require('../../../controllers/candles/constants');

const CONNECTION_NAME = 'BinanceScreener:Futures:Kline_5m';

module.exports = async () => {
  try {
    let sendPongInterval;
    const connectStr = `ws://localhost:${port}`;

    const websocketConnect = () => {
      const client = new WebSocketClient(connectStr);

      client.on('open', () => {
        log.info(`${CONNECTION_NAME} was opened`);

        client.send(JSON.stringify({
          actionName: 'subscribe',
          data: { subscriptionName: ACTION_NAMES.get('futuresCandle5mData') },
        }));

        sendPongInterval = setInterval(() => {
          client.send(JSON.stringify({ actionName: 'pong' }));
        }, 30 * 60 * 1000); // 30 minutes
      });

      client.on('close', (message) => {
        log.info(`${CONNECTION_NAME} was closed`);

        sendMessage(260325716, `${CONNECTION_NAME} was closed (${message})`);
        clearInterval(sendPongInterval);
        websocketConnect();
      });

      client.on('message', async bufferData => {
        const parsedData = JSON.parse(bufferData.toString());

        const {
          instrumentId,
          instrumentName,
          startTime,
          open,
          close,
          high,
          low,
          volume,
          isClosed,
        } = parsedData;

        const resultUpdateInstrument = await updateInstrumentInRedis({
          instrumentName,
          price: parseFloat(close),
        });

        if (!resultUpdateInstrument || !resultUpdateInstrument.status) {
          log.warn(resultUpdateInstrument.message || 'Cant updateInstrumentInRedis');
        }

        await checkUserLevelBounds({
          instrumentId,
          instrumentName,
          instrumentPrice: parseFloat(close),
        });

        sendData({
          actionName: ACTION_NAMES.get('futuresCandle5mData'),
          data: {
            instrumentId,
            instrumentName,
            startTime,
            open,
            close,
            high,
            low,
            volume,
          },
        });

        if (isClosed) {
          const resultUpdate = await updateCandlesInRedis({
            instrumentId,
            instrumentName,
            interval: INTERVALS.get('5m'),

            newCandle: {
              volume,
              time: startTime,
              data: [open, close, low, high],
            },
          });

          if (!resultUpdate || !resultUpdate.status) {
            log.warn(resultUpdate.message || 'Cant updateCandlesInRedis');
            return true;
          }

          const resultCalculate = await calculateTrendFor5mTimeframe({
            instrumentId,
            instrumentName,
          });

          if (!resultCalculate || !resultCalculate.status) {
            log.warn(resultCalculate.message || 'Cant calculateTrendFor5mTimeframe');
            return true;
          }
        }
      });
    };

    websocketConnect();
  } catch (error) {
    log.error(error.message);
    console.log(error);
    return false;
  }
};
