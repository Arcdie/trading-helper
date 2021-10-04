const ws = require('ws');

const log = require('../libs/logger');

const wss = new ws.WebSocketServer({
  port: 3001,
});

/*
wss.on('connection', connection => {
  connection.send(JSON.stringify({
    actionName: 'newConnection',
    message: 'ляля',
  }));
});
*/

const sendData = obj => {
  wss.clients.forEach(ws => {
    if (ws.isAlive === false) return ws.terminate();
    ws.send(JSON.stringify(obj));
  });
};

module.exports = {
  sendData,
};
