const moment = require('moment');

const log = require('../../../libs/logger');

const {
  sleep,
} = require('../../../libs/support');

const {
  sendMessage,
} = require('../../../services/telegram-bot');

const {
  create1mCandles,
} = require('../utils/create-1m-candles');

const {
  getSpotCandles,
} = require('../../binance/utils/spot/get-spot-candles');

const {
  getFuturesCandles,
} = require('../../binance/utils/futures/get-futures-candles');

const {
  getActiveInstruments,
} = require('../../instruments/utils/get-active-instruments');

module.exports = async (req, res, next) => {
  const resultGetInstruments = await getActiveInstruments({
    isOnlySpot: true,
  });

  if (!resultGetInstruments || !resultGetInstruments.status) {
    return res.json({
      status: false,
      message: resultGetInstruments.message || 'Cant getActiveInstruments',
    });
  }

  if (!resultGetInstruments.result || !resultGetInstruments.result.length) {
    return res.json({ status: true });
  }

  const instrumentsDocs = resultGetInstruments.result;

  const startTimeUnix = moment()
    .utc()
    .add(-10, 'minutes')
    .startOf('hour')
    .unix();

  const endTimeUnix = startTimeUnix + 3599;

  for await (const instrumentDoc of instrumentsDocs) {
    let execFunc;
    let instrumentName = instrumentDoc.name;

    if (!instrumentDoc.is_futures) {
      execFunc = getSpotCandles;
    } else {
      execFunc = getFuturesCandles;
      instrumentName = instrumentName.replace('PERP', '');
    }

    let resultGetCandles;

    try {
      resultGetCandles = await execFunc({
        symbol: instrumentName,
        interval: '1m',
        limit: 60,

        startTime: startTimeUnix * 1000,
        endTime: endTimeUnix * 1000,
      });

      if (!resultGetCandles || !resultGetCandles.status) {
        log.warn(resultGetCandles.message || 'Cant getCandles from binance');
        continue;
      }
    } catch (error) {
      sendMessage(260325716, 'Alarm! Ошибка при загрузке свечей с binance');
      break;
    }

    const newCandles = resultGetCandles.result.map(candleData => {
      const [
        startTimeBinance,
        open,
        high,
        low,
        close,
        volume,
        closeTime,
      ] = candleData;

      const validDate = moment.unix(startTimeBinance / 1000);

      return {
        instrumentId: instrumentDoc._id,
        startTime: validDate,
        open: parseFloat(open),
        close: parseFloat(close),
        high: parseFloat(high),
        low: parseFloat(low),
        volume: parseInt(volume, 10),
      };
    });

    const resultCreateCandles = await create1mCandles({
      isFutures: instrumentDoc.is_futures,
      newCandles,
    });

    if (!resultCreateCandles || !resultCreateCandles.status) {
      return {
        status: false,
        message: resultCreateCandles.message || 'Cant create1mCandles',
      };
    }

    await sleep(1000);
  }

  return res.json({
    status: true,
  });
};
