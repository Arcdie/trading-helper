const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const {
  getCandles,
} = require('../binance/utils/get-candles');

const Candle = require('../../models/Candle');
const Instrument = require('../../models/Instrument');

module.exports = async (req, res, next) => {
  const {
    query: {
      instrumentId,
      startTime,
      endTime,
    },

    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  if (!instrumentId || !isMongoId(instrumentId)) {
    return res.json({
      status: false,
      message: 'No or invalid instrumentId',
    });
  }

  if (!startTime || !moment(startTime).isValid()) {
    return res.json({
      status: false,
      message: 'No or invalid startTime',
    });
  }

  if (!endTime || !moment(endTime).isValid()) {
    return res.json({
      status: false,
      message: 'No or invalid endTime',
    });
  }

  const instrumentDoc = await Instrument.findById(instrumentId, {
    is_active: 1,
    name_spot: 1,
  }).exec();

  if (!instrumentDoc) {
    return res.json({
      status: false,
      message: 'No Instrument',
    });
  }

  if (!instrumentDoc.is_active) {
    return res.json({
      status: false,
      message: 'Instrument is not active',
    });
  }

  const momentEndTime = moment(endTime).startOf('minute');
  const momentStartTime = moment(startTime).startOf('minute');

  const startTimeMinusExtraTime = momentStartTime.add(-5, 'minutes');
  const endTimePlusExtraTime = momentEndTime.add(6, 'minutes');

  const numberTargetMinutes = Math.ceil(
    Math.abs(endTimePlusExtraTime.unix() - startTimeMinusExtraTime.unix()) / 60,
  );

  const candlesDocs = await Candle.find({
    instrument_id: instrumentId,

    $and: [{
      time: {
        $gte: startTimeMinusExtraTime,
      },
    }, {
      time: {
        $lte: endTimePlusExtraTime,
      },
    }],
  }).exec();

  const undefinedPeriodsOfCandles = [];

  for (let i = 0; i < numberTargetMinutes; i += 1) {
    let targetMinute;

    if (i === 0) {
      targetMinute = startTimeMinusExtraTime;
    } else {
      targetMinute = moment(startTimeMinusExtraTime).add(i, 'minute');
    }

    const unixMinute = targetMinute.unix();

    const doesExistCandleInBase = candlesDocs.some(
      doc => moment(doc.time).unix() === unixMinute,
    );

    if (!doesExistCandleInBase) {
      undefinedPeriodsOfCandles.push(unixMinute * 1000);
    }
  }

  if (undefinedPeriodsOfCandles && undefinedPeriodsOfCandles.length) {
    const lUndefinedCandles = undefinedPeriodsOfCandles.length;

    const resultGetCandles = await getCandles({
      symbol: instrumentDoc.name_spot,
      startTime: undefinedPeriodsOfCandles[0],
      endTime: undefinedPeriodsOfCandles[lUndefinedCandles - 1],
      limit: lUndefinedCandles,
      interval: '1m',
    });

    if (!resultGetCandles || !resultGetCandles.status) {
      return res.json({
        status: false,
        message: resultGetCandles.message || 'Cant getCandles',
      });
    }

    await Promise.all(resultGetCandles.result.map(async candle => {
      const [
        startTimeBinance,
        open,
        high,
        low,
        close,
        volume,
        closeTime,
      ] = candle;

      const validDate = moment.unix(startTimeBinance / 1000).startOf('minute');

      const newCandle = new Candle({
        instrument_id: instrumentDoc._id,
        open: parseFloat(open),
        high: parseFloat(high),
        low: parseFloat(low),
        close: parseFloat(close),
        volume: parseFloat(volume),
        time: validDate,
      });

      await newCandle.save();
      candlesDocs.push(newCandle);
    }));
  }

  return res.json({
    status: true,
    result: candlesDocs.map(doc => doc._doc),
  });
};
