const fs = require('fs');
const path = require('path');
const https = require('https');

const log = require('./libs/logger');
const app = require('./middlewares');

const config = require('./config');

const migrations = require('./migrations');
const experiments = require('./experiments');
const initServices = require('./services');

const server = app.listen(config.app.port, config.app.host, (err) => {
  if (err) throw new Error(err);

  log.info(`Server running at ${config.app.url}:${config.app.port}`);

  migrations();
  experiments();
  initServices();
});
