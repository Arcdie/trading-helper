const moment = require('moment');

const log = require('../../../libs/logger');

const {
  sleep,
  getUnix,
} = require('../../../libs/support');

const {
  sendMessage,
} = require('../../../services/telegram-bot');

const {
  create5mCandles,
} = require('../utils/create-5m-candles');

const {
  clearCandlesInRedis,
} = require('../utils/clear-candles-in-redis');

const {
  getSpotCandles,
} = require('../../binance/utils/spot/get-spot-candles');

const {
  getFuturesCandles,
} = require('../../binance/utils/futures/get-futures-candles');

const {
  getActiveInstruments,
} = require('../../instruments/utils/get-active-instruments');

const {
  INTERVALS,
} = require('../constants');

const Candle5m = require('../../../models/Candle-5m');

module.exports = async (req, res, next) => {
  try {
    const resultGetInstruments = await getActiveInstruments({});

    if (!resultGetInstruments || !resultGetInstruments.status) {
      log.warn(resultGetInstruments.message || 'Cant getActiveInstruments');

      return res.json({
        status: false,
      });
    }

    if (!resultGetInstruments.result || !resultGetInstruments.result.length) {
      return res.json({
        status: true,
      });
    }

    const startDate = moment().utc()
      .add(-10, 'minutes')
      .startOf('hour')
      .add(-10, 'minutes');

    const endDate = moment().utc()
      .add(-10, 'minutes')
      .endOf('hour');

    const startTimeUnix = moment(startDate).unix();
    const endTimeUnix = moment(endDate).unix();

    const instrumentsDocs = resultGetInstruments.result;

    for await (const instrumentDoc of instrumentsDocs) {
      const candles5mDocs = await Candle5m.find({
        instrument_id: instrumentDoc._id,

        $and: [{
          time: { $gte: startDate },
        }, {
          time: { $lt: endDate },
        }],
      }, { time: 1 }).sort({ time: 1 }).exec();

      const candlesTimeToCreate = [];
      let nextTimeUnix = getUnix(candles5mDocs[0].time);

      while (nextTimeUnix !== endTimeUnix) {
        const candleDoc = candles5mDocs[0];
        const candleTimeUnix = getUnix(candleDoc.time);

        if (nextTimeUnix !== candleTimeUnix) {
          candlesTimeToCreate.push(nextTimeUnix);
        } else {
          candles5mDocs.shift();
        }

        nextTimeUnix += 300;
      }

      if (!candlesTimeToCreate.length) {
        continue;
      }

      log.info(`Instrument ${instrumentDoc.name}`);
      log.info('Started loading candles');

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
          interval: INTERVALS.get('5m'),
          limit: 24, // 2 hours

          startTime: startTimeUnix * 1000,
          endTime: endTimeUnix * 1000,
        });

        if (!resultGetCandles || !resultGetCandles.status) {
          log.warn(resultGetCandles.message || 'Cant getCandles from binance');
          continue;
        }
      } catch (error) {
        log.warn(error.message);
        sendMessage(260325716, `Alarm! Ошибка при загрузке 5m-свечей с binance: ${instrumentDoc.name}`);
        continue;
      }

      const newCandles = [];

      resultGetCandles.result.forEach(candleData => {
        const [
          startTimeBinance,
          open,
          high,
          low,
          close,
          volume,
          closeTime,
        ] = candleData;

        const binanceStartTimeUnix = startTimeBinance / 1000;

        if (candlesTimeToCreate.includes(binanceStartTimeUnix)) {
          const validDate = moment.unix(binanceStartTimeUnix);

          newCandles.push({
            instrumentId: instrumentDoc._id,
            startTime: validDate,
            open: parseFloat(open),
            close: parseFloat(close),
            high: parseFloat(high),
            low: parseFloat(low),
            volume: parseInt(volume, 10),
          });
        }
      });

      const resultCreateCandles = await create5mCandles({
        isFutures: instrumentDoc.is_futures,
        newCandles,
      });

      if (!resultCreateCandles || !resultCreateCandles.status) {
        return {
          status: false,
          message: resultCreateCandles.message || 'Cant create5mCandles',
        };
      }

      const resultClear = await clearCandlesInRedis({
        instrumentName: instrumentDoc.name,
      });

      if (!resultClear || !resultClear.status) {
        log.warn(resultClear.message || 'Cant clearCandlesInRedis');
      }

      await sleep(1000);
    }

    log.info('Process hourly-check-5m-candles was finished');

    return res.json({
      status: true,
    });
  } catch (err) {
    log.warn(err.message);

    return res.json({
      status: false,
    });
  }
};
