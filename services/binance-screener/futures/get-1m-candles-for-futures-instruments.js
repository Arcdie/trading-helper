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
  updateInstrumentInRedis,
} = require('../../../controllers/instruments/utils/update-instrument-in-redis');

const {
  checkUserNotifications,
} = require('../../../controllers/user-notifications/utils/check-user-notifications');

const {
  checkUserFigureLineBounds,
} = require('../../../controllers/user-figure-line-bounds/utils/check-user-figure-line-bounds');

const {
  checkUserFigureLevelBounds,
} = require('../../../controllers/user-figure-level-bounds/utils/check-user-figure-level-bounds');

const {
  binanceScreenerConf,
} = require('../../../config');

const {
  ACTION_NAMES,
} = require('../../../websocket/constants');

const {
  INTERVALS,
} = require('../../../controllers/candles/constants');

const CONNECTION_NAME = 'TradingHelperToBinanceScreener:Futures:Kline_1m';

class InstrumentQueue extends QueueHandler {
  async nextStep() {
    const step = this.queue.shift();

    if (!step) {
      this.isActive = false;
      return true;
    }

    const [
      resultUpdateInstrument,
      // resultUpdate,
      // resultCalculate,
    ] = await Promise.all([
      updateInstrumentInRedis({
        instrumentName: step.instrumentName,
        price: parseFloat(step.close),
      }),

      /*
      updateCandlesInRedis({
        instrumentId: step.instrumentId,
        instrumentName: step.instrumentName,
        interval: INTERVALS.get('1m'),

        newCandle: {
          volume: step.volume,
          time: step.startTime,
          data: [step.open, step.close, step.low, step.high],
        },
      }),
      */

      /*
      calculateTrendFor1mTimeframe({
        instrumentId: step.instrumentId,
        instrumentName: step.instrumentName,
      }),
      */
    ]);

    if (!resultUpdateInstrument || !resultUpdateInstrument.status) {
      log.warn(resultUpdateInstrument.message || 'Cant updateInstrumentInRedis');
    }

    /*
    if (!resultUpdate || !resultUpdate.status) {
      log.warn(resultUpdate.message || 'Cant updateCandlesInRedis');
    }
    */

    /*
    if (!resultCalculate || !resultCalculate.status) {
      log.warn(resultCalculate.message || 'Cant calculateTrendFor1mTimeframe');
    }
    */

    return this.nextStep();
  }
}

class InstrumentQueueWithDelay extends QueueHandler {
  async nextTick() {
    const [
      resultCheckNotifications,
      // resultCheckUserFigureLineBounds,
      // resultCheckUserFigureLevelBounds,
    ] = await Promise.all([
      checkUserNotifications({
        instrumentId: this.lastTick.instrumentId,
        instrumentName: this.lastTick.instrumentName,
        price: this.lastTick.close,
      }),

      /*
      checkUserFigureLineBounds({
        instrumentId: this.lastTick.instrumentId,
        instrumentName: this.lastTick.instrumentName,
        instrumentPrice: this.lastTick.close,
      }),

      checkUserFigureLevelBounds({
        instrumentId: this.lastTick.instrumentId,
        instrumentName: this.lastTick.instrumentName,
        instrumentPrice: this.lastTick.close,
      }),
      */
    ]);

    if (!resultCheckNotifications || !resultCheckNotifications.status) {
      log.warn(resultCheckNotifications.message || 'Cant checkUserNotifications');
    }

    /*
    if (!resultCheckUserFigureLineBounds || !resultCheckUserFigureLineBounds.status) {
      log.warn(resultCheckUserFigureLineBounds.message || 'Cant checkUserFigureLineBounds');
    }

    if (!resultCheckUserFigureLevelBounds || !resultCheckUserFigureLevelBounds.status) {
      log.warn(resultCheckUserFigureLevelBounds.message || 'Cant checkUserFigureLevelBounds');
    }
    */

    setTimeout(() => { this.nextTick(); }, 1 * 1000);
  }
}

module.exports = async () => {
  try {
    let sendPongInterval;
    const connectStr = `ws://${binanceScreenerConf.host}:${binanceScreenerConf.websocketPort}`;

    const instrumentsQueues = [];
    const instrumentQueue = new InstrumentQueue();

    const websocketConnect = () => {
      let isOpened = false;
      let client = new WebSocketClient(connectStr);

      client.on('open', () => {
        isOpened = true;
        log.info(`${CONNECTION_NAME} was opened`);

        client.send(JSON.stringify({
          actionName: 'subscribe',
          data: { subscriptionName: ACTION_NAMES.get('futuresCandle1mData') },
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
          actionName: ACTION_NAMES.get('futuresCandle1mData'),
          data: parsedData.data,
        });

        const {
          instrumentName,
        } = parsedData.data;

        if (!instrumentsQueues[instrumentName]) {
          instrumentsQueues[instrumentName] = new InstrumentQueueWithDelay(instrumentName);
        }

        instrumentsQueues[instrumentName].updateLastTick(parsedData.data);

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
