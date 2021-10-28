const ws = require('ws');
const url = require('url');

const log = require('../libs/logger');
const redis = require('../libs/redis');

const {
  ACTION_NAMES,
} = require('./constants');

const wss = new ws.WebSocketServer({
  port: 3001,
});

wss.on('connection', (ws, req, client) => {
  ws.isAlive = true;
  ws.socketId = new Date().getTime().toString();

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', async message => {
    const data = JSON.parse(message.toString());

    if (!data.actionName) {
      log.warn('No actionName');
      return false;
    }

    switch (data.actionName) {
      case 'subscribe': await newSubscribe(data.data, ws.socketId); break;
      default: break;
    }
  });
});

const sendData = async obj => {
  if (!wss.clients || !wss.clients.size) {
    return true;
  }

  const { actionName } = obj;

  const socketsIds = [];

  if (actionName === 'candleData') {
    const { instrumentId } = obj.data;
    const subscriptionKeysAndValues = await redis.hgetallAsync(`SUBSCRIPTION:${actionName}`);

    if (!subscriptionKeysAndValues) {
      return true;
    }

    Object.keys(subscriptionKeysAndValues).forEach(key => {
      if (subscriptionKeysAndValues[key] === instrumentId) {
        socketsIds.push(key);
      }
    });
  } else {
    const subscriptionKeys = await redis.hkeysAsync(`subscription:${actionName}`);

    if (!subscriptionKeys || !subscriptionKeys.length) {
      return true;
    }

    socketsIds.push(...subscriptionKeys);
  }

  const targetClients = [...wss.clients].filter(
    client => socketsIds.includes(client.socketId),
  );

  targetClients.forEach(ws => {
    if (ws.isAlive === false) return ws.terminate();
    ws.send(JSON.stringify(obj));
  });
};

module.exports = {
  sendData,
};

/*
  subscription:candleData = key:userId = { additionalParams }
  socket:socketId = [candleData, updateAverageVolume]
*/

const intervalCheckDeadConnections = async (clients, interval) => {
  for (const client of clients) {
    if (!client.isAlive) {
      await clearUserFromSubscription(client.socketId);
    }

    ws.isAlive = false;
    ws.ping();
  }

  setTimeout(() => {
    intervalCheckDeadConnections(clients, interval);
  }, interval);
};

// intervalCheckDeadConnections(wss.clients, 10 * 60 * 1000); // 10 minutes

const clearUserFromSubscription = async socketId => {
  const keySocketId = `SOCKET_ID:${socketId}`;
  let cacheDoc = await redis.getAsync(keySocketId);

  if (!cacheDoc) {
    return true;
  }

  cacheDoc = JSON.parse(cacheDoc);

  const fetchPromises = [];

  cacheDoc.forEach(subscriptionName => {
    fetchPromises.push(
      redis.hdelAsync(`SUBSCRIPTION:${subscriptionName}`, socketId),
    );
  });

  fetchPromises.push(
    redis.del(keySocketId),
  );

  await Promise.all(fetchPromises);
};

const newSubscribe = async (data = {}, socketId) => {
  if (!data || !data.subscriptionName) {
    log.warn('No data or subscriptionName');
    return false;
  }

  if (!ACTION_NAMES.get(data.subscriptionName)) {
    log.warn('No or invalid subscriptionName');
    return false;
  }

  let additionalParam = '*';

  if (data.subscriptionName === ACTION_NAMES.get('candleData')) {
    additionalParam = data.instrumentId;
  }

  const keySocketId = `SOCKET_ID:${socketId}`;
  let cacheDoc = await redis.getAsync(keySocketId);

  if (!cacheDoc) {
    cacheDoc = [];
  } else {
    cacheDoc = JSON.parse(cacheDoc);
  }

  const fetchPromises = [];

  const doesExistSubscription = cacheDoc.some(
    subscription => subscription === data.subscriptionName,
  );

  if (!doesExistSubscription) {
    cacheDoc.push(data.subscriptionName);

    fetchPromises.push(
      redis.setAsync([
        keySocketId,
        JSON.stringify(cacheDoc),
      ]),
    );
  }

  fetchPromises.push(
    redis.hmsetAsync(
      `SUBSCRIPTION:${data.subscriptionName}`,
      socketId,
      additionalParam,
    ),
  );

  await Promise.all(fetchPromises);
};
