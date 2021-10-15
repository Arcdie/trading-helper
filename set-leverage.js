const crypto = require('crypto');
const xml2js = require('xml2js');
const readline = require('readline');

const {
  isNumber,
} = require('lodash');

require('./middlewares/utils/set-env');

const {
  binanceConf,
} = require('./config');

const log = require('./libs/logger');

const {
  sleep,
} = require('./libs/support');

const {
  setLeverage,
} = require('./controllers/binance/utils/set-leverage');

const {
  getLeverageBracketsData,
} = require('./controllers/binance/utils/get-leverage-brackets');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = () => {
  rl.question('Введите плечо\n', answer => {
    if (!answer) {
      log.warn('Вы ничего не ввели');
      return askQuestion();
    }

    const numberAnswer = parseInt(answer, 10);

    if (Number.isNaN(numberAnswer)
      || numberAnswer < 0
      || numberAnswer > 125) {
      log.warn('Невалидные данные');
      return askQuestion();
    }

    setLeverageForAllInstruments(numberAnswer);
  });
};

const setLeverageForAllInstruments = async myLeverage => {
  log.info('Это может занять некоторое время');

  const timestamp = new Date().getTime();

  let signature = crypto
    .createHmac('sha256', binanceConf.secret)
    .update(`timestamp=${timestamp}`)
    .digest('hex');

  const resultGetLeverageBracketsData = await getLeverageBracketsData({
    signature,
    timestamp,
    apikey: binanceConf.apikey,
  });

  if (!resultGetLeverageBracketsData || !resultGetLeverageBracketsData.status) {
    log.error(resultGetLeverageBracketsData.message || 'Cant getLeverageBracketsData');
    return false;
  }

  await (async () => {
    const lSymbols = resultGetLeverageBracketsData.result.length;

    for (let i = 0; i < lSymbols; i += 1) {
      const symbolObj = resultGetLeverageBracketsData.result[i];

      if (!symbolObj.symbol.includes('USDT')) {
        continue;
      }

      let maxLeverage = symbolObj.brackets[0].initialLeverage;

      symbolObj.brackets.forEach(bracket => {
        if (maxLeverage < bracket.initialLeverage) {
          maxLeverage = bracket.initialLeverage;
        }
      });

      if (maxLeverage < myLeverage) {
        log.info(`symbol: ${symbolObj.symbol}, maxLeverage: ${maxLeverage}. Skip`);
        continue;
      }

      signature = crypto
        .createHmac('sha256', binanceConf.secret)
        .update(`symbol=${symbolObj.symbol}&leverage=${myLeverage}&timestamp=${timestamp}`)
        .digest('hex');

      const resultSetLeverage = await setLeverage({
        timestamp,
        signature,
        leverage: myLeverage,
        symbol: symbolObj.symbol,
        apikey: binanceConf.apikey,
      });

      if (!resultSetLeverage || !resultSetLeverage.status) {
        log.error(resultSetLeverage.message || 'Cant setLeverage');
        continue;
      }

      await sleep(500);
      log.info(`Ended ${symbolObj.symbol}`);
    }
  })();
};

askQuestion();
