const wsConnectionPort = 3001;
const wsConnectionLink = location.host === 'localhost:3000' ?
  'localhost' : '91.240.242.90';

const wsClient = new WebSocket(`ws://${wsConnectionLink}:${wsConnectionPort}`);
