const WebSocketClient = require('ws');

const log = require('../../../libs/logger');

const {
  sendMessage,
} = require('../../telegram-bot');

const {
  sendData,
} = require('../../websocket-server');

const {
  updateLimitOrdersForInstrumentInRedis,
} = require('../../../controllers/instrument-volume-bounds/utils/update-limit-orders-for-instrument-in-redis');

const {
  DOCS_LIMITER_FOR_QUEUES,
} = require('../../../controllers/instruments/constants');

const CONNECTION_NAME = 'Futures:Depth';

module.exports = async (instrumentsDocs = []) => {
  try {
    if (!instrumentsDocs || !instrumentsDocs.length) {
      return true;
    }

    const queue = [];

    let sendPongInterval;
    let connectStr = 'wss://fstream.binance.com/stream?streams=';

    instrumentsDocs.forEach(doc => {
      const cutName = doc.name.toLowerCase().replace('perp', '');
      connectStr += `${cutName}@depth@500ms/`;
    });

    connectStr = connectStr.substring(0, connectStr.length - 1);

    const websocketConnect = () => {
      const client = new WebSocketClient(connectStr);
      nextStep(queue);

      client.on('open', () => {
        log.info(`${CONNECTION_NAME} was opened`);
        sendMessage(260325716, `${CONNECTION_NAME} was opened`);

        sendPongInterval = setInterval(() => {
          client.pong();
          console.log('spot queue.length', queue.length);
        }, 1000 * 60); // 1 minute
      });

      client.on('ping', () => {
        client.pong();
      });

      client.on('close', (message) => {
        log.info(`${CONNECTION_NAME} was closed`);
        sendMessage(260325716, `${CONNECTION_NAME} was closed (${message})`);
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

        queue.push({
          asks,
          bids,
          instrumentName: `${instrumentName}PERP`,
        });
      });
    };

    websocketConnect();
  } catch (error) {
    console.log(error);
    return false;
  }
};

const nextStep = async (queue) => {
  const targetElements = queue.splice(0, DOCS_LIMITER_FOR_QUEUES);

  console.log('futures.targetElements.length', targetElements.length);

  if (!targetElements || !targetElements.length) {
    setTimeout(() => {
      nextStep(queue);
    }, 5 * 1000); // 5 seconds

    return true;
  }

  await Promise.all(targetElements.map(async ({
    asks, bids, instrumentName,
  }) => {
    await updateLimitOrdersForInstrumentInRedis({
      asks, bids, instrumentName,
    });
  }));

  await nextStep(queue);
};
