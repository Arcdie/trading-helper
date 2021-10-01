const ws = require('ws');

const log = require('../libs/logger');

const wss = new ws.WebSocketServer({
  port: 8080,
});

/*
wss.on('connection', connection => {
  connection.send(JSON.stringify({
    actionName: 'newConnection',
    message: 'ляля',
  }));
});
*/

const sendData = message => {
  wss.clients.forEach(ws => {
    if (ws.isAlive === false) return ws.terminate();
    ws.send(message);
  });
};

module.exports = {
  sendData,
};
