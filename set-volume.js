const fs = require('fs');
const util = require('util');
const path = require('path');
const moment = require('moment');
const xml2js = require('xml2js');
const readline = require('readline');

const {
  isNumber,
} = require('lodash');

const {
  sleep,
} = require('./libs/support');

const {
  getCandles,
} = require('./controllers/binance/utils/get-candles');

xml2js.parseStringPromise = util.promisify(xml2js.parseString);

const log = require('./libs/logger');

const {
  getExchangeInfo,
} = require('./controllers/binance/utils/get-exchange-info');

const {
  getBinanceInstruments,
} = require('./controllers/binance/utils/get-binance-instruments');

const pathToRoot = path.parse(process.cwd()).root;
// const pathToSettingsFolder = path.join(__dirname, './files/MVS');
const pathToSettingsFolder = 'D:\\FSR Launcher\\SubApps\\CScalp\\Data\\MVS';

if (!fs.existsSync(pathToSettingsFolder)) {
  log.warn('Cant find settings folder');
  process.exit(1);
}

const filesNames = fs.readdirSync(pathToSettingsFolder);

const setVolume = async () => {
  log.info('Это может занять некоторое время');

  const resultGetExchangeInfo = await getExchangeInfo();

  if (!resultGetExchangeInfo || !resultGetExchangeInfo.status) {
    log.error(resultGetExchangeInfo.message || 'Cant getExchangeInfo');
    return false;
  }

  let symbols = resultGetExchangeInfo.result.symbols
    .map(elem => elem.symbol)
    .filter(elem => elem.includes('USDT'));
    // .filter(elem => elem.includes('ADAUSDT'));

  const prevDay = moment().startOf('day').add(-1, 'days');

  symbols = symbols.filter(symbol => ['BELUSDT', 'COMPUSDT', 'LINKUSDT', 'SOLUSDT', 'ALPHAUSDT'].includes(symbol));

  await (async () => {
    const lSymbols = symbols.length;

    for (let i = 0; i < lSymbols; i += 1) {
      const symbol = symbols[i];

      const resultGetCandles = await getCandles({
        symbol,
        interval: '1d',
        limit: 1,
        startTime: prevDay.unix() * 1000,
      });

      if (!resultGetCandles || !resultGetCandles.status) {
        log.warn(resultGetCandles.message || 'Cant getCandles');
        continue;
      }

      const volume = parseFloat(resultGetCandles.result[0][5]);
      const averageVolume = Math.ceil(volume / 17280);
      const x2AverageVolume = Math.ceil(averageVolume * 2);

      // console.log('symbol', symbol);
      // console.log('volume', volume);
      // console.log('averageVolume', averageVolume);

      filesNames.forEach(async fileName => {
        if (!fileName.includes(symbol)) {
          return true;
        }

        const fileContent = fs.readFileSync(`${pathToSettingsFolder}/${fileName}`, 'utf8');
        const parsedContent = await xml2js.parseStringPromise(fileContent);

        parsedContent.Settings.DOM[0].FilledAt[0].$.Value = averageVolume.toString();
        parsedContent.Settings.DOM[0].BigAmount[0].$.Value = averageVolume.toString();
        parsedContent.Settings.DOM[0].HugeAmount[0].$.Value = x2AverageVolume.toString();

        parsedContent.Settings.CLUSTER_PANEL[0].FilledAt[0].$.Value = averageVolume.toString();

        const builder = new xml2js.Builder();
        const xml = builder.buildObject(parsedContent);
        fs.writeFileSync(`${pathToSettingsFolder}/${fileName}`, xml);
      });

      await sleep(500);
      log.info(`Ended ${symbol}`);
    }
  })();
};

setVolume();
