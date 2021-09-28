const WebSocketClient = require('websocket').client;

const log = require('../logger');

// log.error(err);

module.exports = () => {
  const client = new WebSocketClient();

  client.on('connectFailed', error => {
    log.warn(`.on('connectFailed') => ${error.toString()}`);
  });

  client.on('connect', connection => {
    console.log('WebSocket Client Connected');

    connection.on('error', error => {
      log.warn(`.on('error') => ${error.toString()}`);
    });

    connection.on('close', () => {
      log.info('Connection was closed');
    });

    connection.on('message', ({ utf8Data }) => {
      const message = JSON.parse(utf8Data);

      const {
        e: actionName,
      } = message;

      console.log(message);
    });
  });

  client.connect('wss://fstream.binance.com/ws/!bookTicker');
};
