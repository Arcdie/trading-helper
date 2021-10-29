/* global user */

const wsConnectionPort = 3001;
const wsConnectionLink = location.host === 'localhost:3000' ?
  'localhost' : '91.240.242.90';

const wsClient = new WebSocket(`ws://${wsConnectionLink}:${wsConnectionPort}?userId=${user._id}`);

// wsClient.on('ping', () => {
//   wsClient.send('pong');
// });

wsClient.onclose = event => {
  alert('Соединение было разорвано, перезагрузите страницу');
};
