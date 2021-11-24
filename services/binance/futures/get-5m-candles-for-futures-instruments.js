const WebSocketClient = require('ws');

const log = require('../../../libs/logger');

const {
  sendMessage,
} = require('../../telegram-bot');

const {
  sendData,
} = require('../../../websocket/websocket-server');

const {
  create5mCandles,
} = require('../../../controllers/candles/utils/create-5m-candles');

const {
  updateCandlesInRedis,
} = require('../../../controllers/candles/utils/update-candles-in-redis');

const {
  checkUserLevelBounds,
} = require('../../../controllers/user-level-bounds/utils/check-user-level-bounds');

const {
  updateInstrumentInRedis,
} = require('../../../controllers/instruments/utils/update-instrument-in-redis');

const {
  calculateTrendFor5mTimeframe,
} = require('../../../controllers/instrument-trends/utils/calculate-trend-for-5m-timeframe');

const {
  INTERVALS,
} = require('../../../controllers/candles/constants');

const CONNECTION_NAME = 'Futures:Kline_5m';

class InstrumentQueue {
  constructor() {
    this.queue = [];
    this.isActive = false;

    this.LIMITER = 20;
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

      const resultCreate = await create5mCandles({
        isFutures: true,
        newCandles: targetSteps,
      });

      if (!resultCreate || !resultCreate.status) {
        log.warn(resultCreate.message || 'Cant create5mCandles (futures)');
        return this.nextStep();
      }

      await Promise.all(resultCreate.result.map(async newCandle => {
        const targetStep = targetSteps.find(
          step => step.instrumentId === newCandle.instrument_id,
        );

        const resultUpdate = await updateCandlesInRedis({
          instrumentId: newCandle.instrument_id,
          instrumentName: targetStep.instrumentName,
          interval: INTERVALS.get('5m'),
          newCandle,
        });

        if (!resultUpdate || !resultUpdate.status) {
          log.warn(resultUpdate.message || 'Cant updateCandlesInRedis');
          return null;
        }

        await calculateTrendFor5mTimeframe({
          instrumentId: newCandle.instrument_id,
          instrumentName: targetStep.instrumentName,
        });
      }));

      setTimeout(() => {
        return this.nextStep();
      }, 2000);
    } else {
      this.isActive = false;
    }
  }
}

module.exports = async (instrumentsDocs = []) => {
  try {
    if (!instrumentsDocs || !instrumentsDocs.length) {
      return true;
    }

    let sendPongInterval;
    let connectStr = 'wss://fstream.binance.com/stream?streams=';

    instrumentsDocs.forEach(doc => {
      const cutName = doc.name.toLowerCase().replace('perp', '');
      connectStr += `${cutName}@kline_5m/`;
    });

    const instrumentQueue = new InstrumentQueue();
    connectStr = connectStr.substring(0, connectStr.length - 1);

    let isSendedInTelegram = false;

    setInterval(() => {
      if (instrumentQueue.queue.length > 300 && !isSendedInTelegram) {
        sendMessage(260325716, `${CONNECTION_NAME} queue > 300`);
        isSendedInTelegram = true;
      }
    }, 1 * 60 * 1000);

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
          instrumentName: `${instrumentName}PERP`,
          price: parseFloat(close),
        });

        const instrumentDoc = resultUpdateInstrument.result;

        await checkUserLevelBounds({
          instrumentId: instrumentDoc._id,
          instrumentName: instrumentDoc.name,
          instrumentPrice: parseFloat(close),
        });

        if (isClosed) {
          instrumentQueue.addIteration({
            instrumentId: instrumentDoc._id,
            instrumentName: instrumentDoc.name,
            startTime: new Date(startTime),
            open,
            close,
            high,
            low,
            volume,
          });
        }

        sendData({
          actionName: 'candle5mData',
          data: {
            instrumentId: instrumentDoc._id,
            startTime,
            open,
            close,
            high,
            low,
            volume,
          },
        });

        sendData({
          actionName: 'newFuturesInstrumentPrice',
          data: {
            newPrice: close,
            instrumentName: instrumentDoc.name,
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
