const ws = require('ws');
const url = require('url');

const {
  isMongoId,
} = require('validator');

const log = require('../libs/logger');
const redis = require('../libs/redis');

const {
  getById,
} = require('../controllers/users/get-by-id');

const {
  ACTION_NAMES,
} = require('./constants');

const WebSocketRoom = require('./websocket-room');

const rooms = [];
const wss = new ws.WebSocketServer({ port: 3001 });

wss.on('connection', async (ws, req) => {
  const {
    query,
  } = url.parse(req.url, true);

  if (!query || !query.userId || !isMongoId(query.userId)) {
    return ws.terminate();
  }

  const socketId = new Date().getTime().toString();

  await redis.hsetAsync([
    `USER:${query.userId}:SOCKETS`,
    socketId,
    JSON.stringify([]),
  ]);

  ws.isAlive = true;
  ws.socketId = socketId;
  ws.userId = query.userId;

  ws.on('message', async message => {
    const data = JSON.parse(message.toString());

    if (!data.actionName) {
      log.warn('No actionName');
      return false;
    }

    switch (data.actionName) {
      case 'pong': {
        ws.isAlive = true;
        break;
      }

      case 'subscribe': {
        await newSubscribe({
          data: data.data,
          userId: ws.userId,
          socketId: ws.socketId,
        }); break;
      }

      default: break;
    }
  });
});

const createWebsocketRooms = (instrumentsDocs = []) => {
  [...ACTION_NAMES.values()].forEach(value => {
    rooms.push(new WebSocketRoom(value));
  });

  [ACTION_NAMES.get('candleData')].forEach(actionName => {
    const targetRoom = rooms.find(room => room.roomName === actionName);

    instrumentsDocs
      .filter(doc => doc.is_futures)
      .forEach(doc => {
        const newRoom = new WebSocketRoom(doc.name);
        targetRoom.addRoom(newRoom);
      });
  });
};

const sendData = obj => {
  const { actionName } = obj;

  const socketsIds = [];
  const targetRoom = rooms.find(room => room.roomName === actionName);

  if (!targetRoom) {
    return true;
  }

  if (actionName === 'candleData') {
    const { instrumentName } = obj.data;

    const targetInstrumentRoom = targetRoom.rooms.find(
      room => room.roomName === instrumentName,
    );

    if (!targetInstrumentRoom) {
      log.warn('No targetInstrumentRoom');
      return false;
    }

    socketsIds.push(...targetInstrumentRoom.members);
  } else {
    socketsIds.push(...targetRoom.members);
  }

  if (!socketsIds || !socketsIds.length) {
    return true;
  }

  const targetClients = [...wss.clients].filter(
    client => socketsIds.includes(client.socketId),
  );

  targetClients.forEach(ws => {
    if (ws.isAlive) {
      ws.send(JSON.stringify(obj));
    }
  });
};

const newSubscribe = async ({
  data,
  userId,
  socketId,
}) => {
  if (!data || !data.subscriptionName) {
    log.warn('No data or subscriptionName');
    return false;
  }

  if (!ACTION_NAMES.get(data.subscriptionName)) {
    log.warn('No or invalid subscriptionName');
    return false;
  }

  const keyUserSubscriptions = `USER:${userId}:SOCKETS`;

  let userSubscriptions = await redis.hgetAsync(
    keyUserSubscriptions,
    socketId,
  );

  if (!userSubscriptions) {
    userSubscriptions = [];
  } else {
    userSubscriptions = JSON.parse(userSubscriptions);
  }

  const doesExistSubscription = userSubscriptions.some(
    subscription => subscription === data.subscriptionName,
  );

  if (!doesExistSubscription) {
    userSubscriptions.push(data.subscriptionName);

    await redis.hsetAsync([
      keyUserSubscriptions,
      socketId,
      JSON.stringify(userSubscriptions),
    ]);
  }

  const targetRoom = rooms.find(room => room.roomName === data.subscriptionName);

  if (!targetRoom) {
    log.warn(`No targetRoom; subscriptionName: ${data.subscriptionName}`);
    return false;
  }

  targetRoom.join(socketId);

  if (data.subscriptionName === ACTION_NAMES.get('candleData')) {
    if (!data.instrumentName) {
      log.warn('No or invalid instrumentName');
      return false;
    }

    const targetInstrumentRoom = targetRoom.rooms.find(
      room => room.roomName === data.instrumentName,
    );

    if (!targetInstrumentRoom) {
      log.warn('No targetInstrumentRoom');
      return false;
    }

    targetInstrumentRoom.join(socketId);
  }
};

module.exports = {
  createWebsocketRooms,
  sendData,
};

const intervalCheckDeadConnections = async (interval) => {
  for (const client of wss.clients) {
    if (client.isAlive) {
      client.isAlive = false;
      continue;
    }

    let userSubscriptions = await redis.hgetAsync([
      `USER:${client.userId}:SOCKETS`,
      client.socketId,
    ]);

    if (!userSubscriptions) {
      continue;
    }

    userSubscriptions = JSON.parse(userSubscriptions);

    userSubscriptions.forEach(subscriptionName => {
      const targetRoom = rooms.find(room => room.roomName === subscriptionName);
      targetRoom.leave(client.socketId);
    });

    await redis.hdelAsync([
      `USER:${client.userId}:SOCKETS`,
      client.socketId,
    ]);

    client.terminate();
  }

  setTimeout(() => {
    intervalCheckDeadConnections(interval);
  }, interval);
};

intervalCheckDeadConnections(5 * 60 * 1000); // 5 minutes
