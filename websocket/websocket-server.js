const ws = require('ws');
const url = require('url');

const {
  isMongoId,
} = require('validator');

const log = require('../libs/logger');
const redis = require('../libs/redis');

const {
  ACTION_NAMES,
  ACION_NAMES_CANDLE_DATA,
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

  ACION_NAMES_CANDLE_DATA.forEach(actionName => {
    const targetRoom = rooms.find(room => room.roomName === actionName);

    instrumentsDocs
      .filter(doc => doc.is_futures)
      .forEach(doc => {
        const newRoom = new WebSocketRoom(doc._id.toString());
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

  if (ACION_NAMES_CANDLE_DATA.includes(actionName)) {
    const { instrumentId } = obj.data;

    const targetInstrumentRoom = targetRoom.rooms.find(
      room => room.roomName === instrumentId.toString(),
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

const sendPrivateData = async obj => {
  const { userId } = obj;

  if (!userId || !isMongoId(userId.toString())) {
    log.warn('Invalid userId');
    return false;
  }

  const socketsIds = await redis.hkeysAsync(`USER:${userId}:SOCKETS`);

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
  if (!data) {
    log.warn('No data');
    return false;
  }

  const subscriptionsNames = [];

  if (data.subscriptionName) {
    subscriptionsNames.push(data.subscriptionName);
  } else {
    subscriptionsNames.push(...data.subscriptionsNames || []);
  }

  if (!subscriptionsNames.length) {
    log.warn('No subscriptionName');
    return false;
  }

  let areSubscriptionsNamesValid = true;

  subscriptionsNames.forEach(subscriptionName => {
    if (!ACTION_NAMES.get(subscriptionName)) {
      areSubscriptionsNamesValid = false;
    }
  });

  if (!areSubscriptionsNamesValid) {
    log.warn('Invalid subscriptionName');
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

  let doesExistNewSubscription = false;

  subscriptionsNames.forEach(subscriptionName => {
    const doesExistSubscription = userSubscriptions.some(
      subscription => subscription === subscriptionName,
    );

    if (!doesExistSubscription) {
      doesExistNewSubscription = true;
      userSubscriptions.push(subscriptionName);
    }
  });

  if (doesExistNewSubscription) {
    await redis.hsetAsync([
      keyUserSubscriptions,
      socketId,
      JSON.stringify(userSubscriptions),
    ]);
  }

  subscriptionsNames.forEach(subscriptionName => {
    const targetRoom = rooms.find(room => room.roomName === subscriptionName);

    if (!targetRoom) {
      log.warn(`No targetRoom; subscriptionName: ${subscriptionName}`);
      return false;
    }

    targetRoom.join(socketId);

    if (ACION_NAMES_CANDLE_DATA.includes(subscriptionName)) {
      if (!data.instrumentId) {
        log.warn('No or invalid instrumentId');
        return false;
      }

      const targetInstrumentRoom = targetRoom.rooms.find(
        room => room.roomName === data.instrumentId,
      );

      if (!targetInstrumentRoom) {
        log.warn('No targetInstrumentRoom');
        return false;
      }

      targetInstrumentRoom.join(socketId);
    }
  });
};

module.exports = {
  createWebsocketRooms,
  sendData,
  sendPrivateData,
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
