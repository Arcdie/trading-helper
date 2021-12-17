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
  calculateTrendFor5mTimeframe,
} = require('../../../controllers/instrument-trends/utils/calculate-trend-for-5m-timeframe');

const {
  binanceScreenerConf: { websocketPort },
} = require('../../../config');

const {
  ACTION_NAMES,
} = require('../../../websocket/constants');

const {
  INTERVALS,
} = require('../../../controllers/candles/constants');

const CONNECTION_NAME = 'BinanceScreener:Spot:Kline_5m';

class InstrumentQueue {
  constructor() {
    this.queue = [];
    this.isActive = false;

    this.LIMITER = 50;
  }

  addIteration(obj) {
    this.queue.push(obj);

    if (!this.isActive) {
      this.isActive = true;
      this.nextStep();
    }
  }

  async nextStep() {
    const lQueue = this.queue.length;

    if (lQueue > 0) {
      const targetSteps = this.queue.splice(0, this.LIMITER);

      await Promise.all(targetSteps.map(async step => {
        const resultUpdate = await updateCandlesInRedis({
          instrumentId: step.instrumentId,
          instrumentName: step.instrumentName,
          interval: INTERVALS.get('5m'),

          newCandle: {
            volume: step.volume,
            time: step.startTime,
            data: [step.open, step.close, step.low, step.high],
          },
        });

        if (!resultUpdate || !resultUpdate.status) {
          log.warn(resultUpdate.message || 'Cant updateCandlesInRedis');
          return null;
        }

        const resultCalculate = await calculateTrendFor5mTimeframe({
          instrumentId: step.instrumentId,
          instrumentName: step.instrumentName,
        });

        if (!resultCalculate || !resultCalculate.status) {
          log.warn(resultCalculate.message || 'Cant calculateTrendFor5mTimeframe');
          return null;
        }
      }));

      setTimeout(() => {
        return this.nextStep();
      }, 2000);
    } else {
      this.isActive = false;
    }
  }
}

module.exports = async () => {
  try {
    let sendPongInterval;
    const instrumentQueue = new InstrumentQueue();
    const connectStr = `ws://localhost:${websocketPort}`;

    const websocketConnect = () => {
      let isOpened = false;
      let client = new WebSocketClient(connectStr);

      client.on('open', () => {
        isOpened = true;
        log.info(`${CONNECTION_NAME} was opened`);

        client.send(JSON.stringify({
          actionName: 'subscribe',
          data: { subscriptionName: ACTION_NAMES.get('spotCandle5mData') },
        }));

        sendPongInterval = setInterval(() => {
          client.send(JSON.stringify({ actionName: 'pong' }));
        }, 30 * 60 * 1000); // 30 minutes
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

        const {
          instrumentName,
          close,
          isClosed,
        } = parsedData.data;

        const resultUpdateInstrument = await updateInstrumentInRedis({
          instrumentName,
          price: parseFloat(close),
        });

        if (!resultUpdateInstrument || !resultUpdateInstrument.status) {
          log.warn(resultUpdateInstrument.message || 'Cant updateInstrumentInRedis');
        }

        /*
        sendData({
          actionName: ACTION_NAMES.get('spotCandle5mData'),
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
