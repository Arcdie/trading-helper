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
  checkInstrumentVolumeBounds,
} = require('../../../controllers/instrument-volume-bounds/utils/check-instrument-volume-bounds');

const {
  binanceScreenerConf,
} = require('../../../config');

const {
  ACTION_NAMES,
} = require('../../../websocket/constants');

const CONNECTION_NAME = 'TradingHelperToBinanceScreener:Futures:Depth';

class InstrumentQueue extends QueueHandler {
  async nextStep() {
    const step = this.queue.shift();

    if (!step) {
      this.isActive = false;
      return true;
    }

    const [asks, bids] = this.queue.shift();

    await checkInstrumentVolumeBounds({
      asks,
      bids,
      instrumentName: this.instrumentName,
    });

    return this.nextStep();
  }
}

module.exports = async () => {
  try {
    let sendPongInterval;
    const connectStr = `ws://${binanceScreenerConf.host}:${binanceScreenerConf.websocketPort}`;

    const websocketConnect = () => {
      let isOpened = false;
      const instrumentsQueues = [];
      let client = new WebSocketClient(connectStr);

      client.on('open', () => {
        isOpened = true;
        log.info(`${CONNECTION_NAME} was opened`);

        client.send(JSON.stringify({
          actionName: 'subscribe',
          data: { subscriptionName: ACTION_NAMES.get('futuresLimitOrders') },
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
          actionName: ACTION_NAMES.get('futuresLimitOrders'),
          data: parsedData.data,
        });

        const {
          asks,
          bids,
          instrumentName,
        } = parsedData.data;

        if (!instrumentsQueues[instrumentName]) {
          instrumentsQueues[instrumentName] = new InstrumentQueue(instrumentName);
        }

        instrumentsQueues[instrumentName].addIteration([asks, bids]);
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
