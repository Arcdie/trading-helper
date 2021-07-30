const path = require('path');

let fileEnv = 'config/envs/';

switch (process.env.INIT_CWD) {
  // case '/home/example/www/example.com': fileEnv = '.env'; break;
  default: { fileEnv += 'localhost.env'; break; }
}

require('dotenv').config({
  path: path.join(__dirname, `../${fileEnv}`),
});

const express = require('express');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');

const log = require('../logger');

const app = express();

// Favicon
app.use(favicon(path.join(__dirname, '../public/images', 'favicon.ico')));

// bodyParser
app.use(bodyParser.json({}));
app.use(bodyParser.urlencoded({
  extended: false,
}));

app.use(express.static(path.join(__dirname, '../public')));

// if (process.env.environment !== 'production') {
//   app.use(morgan);
// }

// Routing
app.use('/', require('../routes'));

// Error handing
app.use((req, res) => {
  res.sendStatus(404);
});

app.use((err, req, res, next) => {
  log.warn(err);

  if (req.method === 'GET') {
    res.sendStatus(500);
  } else {
    res.sendStatus(500);
  }
});

process.on('uncaughtException', (err) => {
  log.error(err);
  process.exit(1);
});

module.exports = app;
