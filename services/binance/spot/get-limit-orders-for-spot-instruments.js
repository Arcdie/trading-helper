const WebSocketClient = require('ws');

const log = require('../../../libs/logger');

const {
  sendMessage,
} = require('../../telegram-bot');

const {
  sendData,
} = require('../../../websocket/websocket-server');

const {
  checkInstrumentVolumeBounds,
} = require('../../../controllers/instrument-volume-bounds/utils/check-instrument-volume-bounds');

const {
  DOCS_LIMITER_FOR_QUEUES,
} = require('../../../controllers/instruments/constants');

const CONNECTION_NAME = 'Spot:Depth';

class InstrumentQueue {
  constructor(instrumentName) {
    this.queue = [];
    this.isActive = false;
    this.instrumentName = instrumentName;
  }

  addIteration({ asks, bids }) {
    this.queue.push([asks, bids]);

    if (!this.isActive) {
      this.isActive = true;
      this.nextStep();
    }
  }

  async nextStep() {
    const lQueue = this.queue.length;

    if (lQueue > 0) {
      const [asks, bids] = this.queue.shift();

      await checkInstrumentVolumeBounds({
        asks,
        bids,
        instrumentName: this.instrumentName,
      });

      this.nextStep();
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

    const instrumentsQueues = [];

    instrumentsDocs.forEach(doc => {
      instrumentsQueues[doc.name] = new InstrumentQueue(doc.name);
    });

    let sendPongInterval;
    let connectStr = 'wss://stream.binance.com/stream?streams=';

    instrumentsDocs.forEach(doc => {
      const cutName = doc.name.toLowerCase();
      connectStr += `${cutName}@depth@1000ms/`;
    });

    connectStr = connectStr.substring(0, connectStr.length - 1);

    const websocketConnect = () => {
      const client = new WebSocketClient(connectStr);

      client.on('open', () => {
        log.info(`${CONNECTION_NAME} was opened`);

        sendPongInterval = setInterval(() => {
          client.pong();
          // console.log('spot.queue.length', queue.length);
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

        if (!parsedData.data || !parsedData.data.b) {
          log.warn(`${CONNECTION_NAME}: ${JSON.stringify(parsedData)}`);
          return true;
        }

        const {
          data: {
            a: asks,
            b: bids,
            s: instrumentName,
          },
        } = parsedData;

        instrumentsQueues[instrumentName].addIteration({
          asks, bids,
        });
      });
    };

    websocketConnect();
  } catch (error) {
    console.log(error);
    return false;
  }
};
