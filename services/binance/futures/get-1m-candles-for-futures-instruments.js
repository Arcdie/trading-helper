const WebSocketClient = require('ws');

const log = require('../../../libs/logger');

const {
  sendMessage,
} = require('../../telegram-bot');

const {
  sendData,
} = require('../../../websocket/websocket-server');

const {
  create1mCandle,
} = require('../../../controllers/candles/utils/create-1m-candle');

const {
  calculateTrendFor1mTimeframe,
} = require('../../../controllers/instrument-trends/utils/calculate-trend-for-1m-timeframe');

const CONNECTION_NAME = 'Futures:Kline_1m';

class InstrumentQueue {
  constructor() {
    this.queue = [];
    this.processedInstruments = [];

    this.isActive = false;

    this.LIMITER = 10;
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

      await Promise.all(targetSteps.map(async newCandle => {
        await create1mCandle({
          isFutures: true,
          ...newCandle,
        });

        this.processedInstruments.push({
          instrumentId: newCandle.instrumentId,
          instrumentName: newCandle.instrumentName,
        });
      }));

      this.nextStep();
    } else {
      this.isActive = false;

      if (this.processedInstruments.length) {
        await Promise.all(this.processedInstruments.map(async instrumentObj => {
          // todo: need optimize
          await calculateTrendFor1mTimeframe(instrumentObj);
        }));

        this.processedInstruments = [];
      }
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
      connectStr += `${cutName}@kline_1m/`;
    });

    const instrumentQueue = new InstrumentQueue();
    connectStr = connectStr.substring(0, connectStr.length - 1);

    setInterval(() => {
      console.log('1m, futures, q.length', instrumentQueue.queue.length);
    }, 5 * 1000);

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

        const validInstrumentName = `${instrumentName}PERP`;
        const instrumentDoc = instrumentsDocs.find(doc => doc.name === validInstrumentName);

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

        /*
        sendData({
          actionName: 'candle1mData',
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
        */
      });
    };

    websocketConnect();
  } catch (error) {
    console.log(error);
    return false;
  }
};
