const path = require('path');

require('./utils/set-env');

// const helmet = require('helmet');
const express = require('express');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

require('../libs/redis');
require('../libs/mongodb');
const morgan = require('../libs/morgan');

const log = require('../libs/logger');

const app = express();

const frontFolder = path.join(__dirname, '../../trading-helper-front');

// app.use(helmet());

// Page Rendering
app.set('views', `${frontFolder}/views`);
app.set('view engine', 'pug');

// Favicon
app.use(favicon(path.join(frontFolder, '/public/images', 'favicon.ico')));

// bodyParser
app.use(bodyParser.json({}));
app.use(bodyParser.urlencoded({
  extended: false,
}));

app.use(express.static(`${frontFolder}/public`));

app.use(morgan);
app.use(cookieParser());

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
