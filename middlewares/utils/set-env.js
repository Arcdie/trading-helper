const path = require('path');

let fileEnv = '../config/envs/';

switch (process.env.pm_cwd) {
  case '/home/ivalentyn/www/trading-helper': fileEnv += 'development.env'; break;
  default: {
    fileEnv += process.argv[2] === 'isLocal'
      ? 'localhost-localhost.env' : 'localhost-development.env';
  }
}

require('dotenv').config({
  path: path.join(__dirname, `../${fileEnv}`),
});
