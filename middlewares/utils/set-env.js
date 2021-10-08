const path = require('path');

let fileEnv = '../config/envs/';

switch (process.env.INIT_CWD) {
  case '/home/ivalentyn/www/trading-helper': fileEnv += 'development.env'; break;
  default: { fileEnv += 'localhost.env'; break; }
}

require('dotenv').config({
  path: path.join(__dirname, `../${fileEnv}`),
});
