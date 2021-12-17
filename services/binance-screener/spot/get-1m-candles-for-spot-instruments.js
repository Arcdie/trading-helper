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
  calculateTrendFor1mTimeframe,
} = require('../../../controllers/instrument-trends/utils/calculate-trend-for-1m-timeframe');

const {
  binanceScreenerConf: { websocketPort },
} = require('../../../config');

const {
  ACTION_NAMES,
} = require('../../../websocket/constants');

const {
  INTERVALS,
} = require('../../../controllers/candles/constants');

const CONNECTION_NAME = 'BinanceScreener:Spot:Kline_1m';

module.exports = async () => {
  try {
    let sendPongInterval;
    const connectStr = `ws://localhost:${websocketPort}`;

    const websocketConnect = () => {
      let isOpened = false;
      const client = new WebSocketClient(connectStr);

      client.on('open', () => {
        isOpened = true;
        log.info(`${CONNECTION_NAME} was opened`);

        client.send(JSON.stringify({
          actionName: 'subscribe',
          data: { subscriptionName: ACTION_NAMES.get('spotCandle1mData') },
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
        } = parsedData.data;

        /*
        sendData({
          actionName: ACTION_NAMES.get('spotCandle1mData'),
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
        */

        if (isClosed) {
          const resultUpdate = await updateCandlesInRedis({
            instrumentId,
            instrumentName,
            interval: INTERVALS.get('1m'),

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

          const resultCalculate = await calculateTrendFor1mTimeframe({
            instrumentId,
            instrumentName,
          });

          if (!resultCalculate || !resultCalculate.status) {
            log.warn(resultCalculate.message || 'Cant calculateTrendFor1mTimeframe');
            return true;
          }
        }
      });

      setTimeout(() => {
        if (!isOpened) {
          sendMessage(260325716, `Cant connect to ${CONNECTION_NAME}`);
          clearInterval(sendPongInterval);
          websocketConnect();
        }
      }, 10 * 1000); // 10 seconds
    };

    websocketConnect();
  } catch (error) {
    console.log('h2');
    log.error(error.message);
    console.log(error);
    return false;
  }
};
