const fs = require('fs');
const util = require('util');
const path = require('path');
const xml2js = require('xml2js');
const readline = require('readline');

const {
  isNumber,
} = require('lodash');

xml2js.parseStringPromise = util.promisify(xml2js.parseString);

const log = require('./libs/logger')(module);

const {
  getFuturesExchangeInfo,
} = require('./controllers/binance/utils/futures/get-futures-exchange-info');

const {
  getFuturesInstruments,
} = require('./controllers/binance/utils/futures/get-futures-instruments');

const pathToRoot = path.parse(process.cwd()).root;
// const pathToSettingsFolder = path.join(__dirname, './files/MVS');
const pathToSettingsFolder = 'D:\\FSR Launcher\\SubApps\\CScalp\\Data\\MVS';

if (!fs.existsSync(pathToSettingsFolder)) {
  log.warn('Cant find settings folder');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const filesNames = fs.readdirSync(pathToSettingsFolder);

const askQuestion = () => {
  rl.question('Введите рабочие объемы через запятую (5 шт.)\n', answer => {
    if (!answer) {
      log.warn('Вы ничего не ввели');
      return askQuestion();
    }

    const arr = answer.split(' ');

    if (!arr || !arr.length || arr.length !== 5) {
      log.warn('Невалидные данные');
      return askQuestion();
    }

    let isDataValid = true;

    arr.forEach(elem => {
      elem = parseFloat(elem);

      if (!isNumber(elem)
        || Number.isNaN(elem)
        || elem < 0) {
        isDataValid = false;
      }

      if (!isDataValid) {
        return false;
      }
    });

    if (!isDataValid) {
      log.warn('Невалидные данные');
      return askQuestion();
    }

    setWorkAmounts(arr.map(elem => parseFloat(elem)));
  });
};

const setWorkAmounts = async workAmounts => {
  const resultGetExchangeInfo = await getFuturesExchangeInfo();

  if (!resultGetExchangeInfo || !resultGetExchangeInfo.status) {
    log.error(resultGetExchangeInfo.message || 'Cant getFuturesExchangeInfo');
    return false;
  }

  const resultGetPrices = await getFuturesInstruments();

  if (!resultGetPrices || !resultGetPrices.status) {
    log.error(resultGetPrices.message || 'Cant getFuturesInstruments');
    return false;
  }

  resultGetPrices.result.forEach(instrument => {
    const symbolInExchangeData = resultGetExchangeInfo.result.symbols.find(
      symbol => instrument.symbol === symbol.symbol,
    );

    if (!symbolInExchangeData) {
      log.warn(`No symbolInExchangeData; ${instrument.symbol}`);
      return true;
    }

    let { stepSize } = symbolInExchangeData.filters[2];

    if (!stepSize) {
      log.warn(`No stepSize; ${instrument.symbol}`);
      return true;
    }

    stepSize = parseFloat(stepSize);
    const instrumentPrice = parseFloat(instrument.price);

    const result = workAmounts.map(workAmount => {
      let tmp = workAmount / instrumentPrice;

      if (tmp < stepSize) {
        tmp = stepSize;
      } else {
        const remainder = tmp % stepSize;

        if (remainder !== 0) {
          tmp -= remainder;

          if (tmp < stepSize) {
            tmp = stepSize;
          }
        }
      }

      return tmp.toFixed(3).toString().replace('.', ',');
    });

    filesNames.forEach(async fileName => {
      if (!fileName.includes(instrument.symbol)) {
        return true;
      }

      const fileContent = fs.readFileSync(`${pathToSettingsFolder}/${fileName}`, 'utf8');
      const parsedContent = await xml2js.parseStringPromise(fileContent);

      parsedContent.Settings.TRADING[0].First_WorkAmount[0].$.Value = result[0];
      parsedContent.Settings.TRADING[0].Second_WorkAmount[0].$.Value = result[1];
      parsedContent.Settings.TRADING[0].Third_WorkAmount[0].$.Value = result[2];
      parsedContent.Settings.TRADING[0].Fourth_WorkAmount[0].$.Value = result[3];
      parsedContent.Settings.TRADING[0].Fifth_WorkAmount[0].$.Value = result[4];

      const builder = new xml2js.Builder();
      const xml = builder.buildObject(parsedContent);
      fs.writeFileSync(`${pathToSettingsFolder}/${fileName}`, xml);
    });

    log.info(`Finished ${instrument.symbol}`);
  });
};

askQuestion();
