const moment = require('moment');

const log = require('../../../libs/logger');

const {
  sleep,
} = require('../../../libs/support');

const {
  sendMessage,
} = require('../../../services/telegram-bot');

const {
  create1mCandle,
} = require('../utils/create-1m-candle');

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
  const resultGetInstruments = await getActiveInstruments({});

  if (!resultGetInstruments || !resultGetInstruments.status) {
    return res.json({
      status: false,
      message: resultGetInstruments.message || 'Cant getActiveInstruments',
    });
  }

  const startTimeUnix = moment()
    .utc()
    .add(-10, 'minutes')
    .startOf('hour')
    .unix();

  const endTimeUnix = startTimeUnix + 3599;

  for (const instrumentDoc of resultGetInstruments.result) {
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

    await Promise.all(resultGetCandles.result.map(async candleData => {
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

      const resultCreateCandle = await create1mCandle({
        instrumentId: instrumentDoc._id,
        startTime: validDate,
        open: parseFloat(open),
        close: parseFloat(close),
        high: parseFloat(high),
        low: parseFloat(low),
        volume: parseInt(volume, 10),
      });

      if (!resultCreateCandle || !resultCreateCandle.status) {
        return {
          status: false,
          message: resultCreateCandle.message || 'Cant create1mCandle',
        };
      }
    }));

    await sleep(1000);
  }

  return res.json({
    status: true,
  });
};
