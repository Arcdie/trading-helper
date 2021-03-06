const WebSocketClient = require('ws');

const log = require('../../../libs/logger')(module);

const QueueHandler = require('../../../libs/queue-handler');

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
  binanceScreenerConf,
} = require('../../../config');

const {
  ACTION_NAMES,
} = require('../../../websocket/constants');

const {
  INTERVALS,
} = require('../../../controllers/candles/constants');

const CONNECTION_NAME = 'TradingHelperToBinanceScreener:Futures:Kline_1h';

class InstrumentQueue extends QueueHandler {
  async nextStep() {
    const step = this.queue.shift();

    if (!step) {
      this.isActive = false;
      return true;
    }

    const [
      resultUpdate,
    ] = await Promise.all([
      updateCandlesInRedis({
        instrumentId: step.instrumentId,
        instrumentName: step.instrumentName,
        interval: INTERVALS.get('1h'),

        newCandle: {
          volume: step.volume,
          time: step.startTime,
          data: [step.open, step.close, step.low, step.high],
        },
      }),
    ]);

    if (!resultUpdate || !resultUpdate.status) {
      log.warn(resultUpdate.message || 'Cant updateCandlesInRedis');
    }

    return this.nextStep();
  }
}

module.exports = async () => {
  try {
    let sendPongInterval;
    const instrumentQueue = new InstrumentQueue();
    const connectStr = `ws://${binanceScreenerConf.host}:${binanceScreenerConf.websocketPort}`;

    const websocketConnect = () => {
      let isOpened = false;
      let client = new WebSocketClient(connectStr);

      client.on('open', () => {
        isOpened = true;
        log.info(`${CONNECTION_NAME} was opened`);

        client.send(JSON.stringify({
          actionName: 'subscribe',
          data: { subscriptionName: ACTION_NAMES.get('futuresCandle1hData') },
        }));

        sendPongInterval = setInterval(() => {
          client.send(JSON.stringify({ actionName: 'pong' }));
        }, 10 * 60 * 1000); // 10 minutes
      });

      client.on('close', (message) => {
        log.info(`${CONNECTION_NAME} was closed`);

        client = false;
        clearInterval(sendPongInterval);
        sendMessage(260325716, `${CONNECTION_NAME} was closed (${message})`);
        websocketConnect();
      });

      client.on('message', async bufferData => {
        const parsedData = JSON.parse(bufferData.toString());

        sendData({
          actionName: ACTION_NAMES.get('futuresCandle1hData'),
          data: parsedData.data,
        });

        if (parsedData.data.isClosed) {
          instrumentQueue.addIteration(parsedData.data);
        }
      });

      setTimeout(() => {
        if (!isOpened) {
          client = false;
          clearInterval(sendPongInterval);
          sendMessage(260325716, `Cant connect to ${CONNECTION_NAME}`);
          websocketConnect();
        }
      }, 10 * 1000); // 10 seconds
    };

    websocketConnect();
  } catch (error) {
    log.error(error.message);
    console.log(error);
    return false;
  }
};
