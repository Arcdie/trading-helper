const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const {
  getCandles,
} = require('../binance/utils/get-candles');

const CandleHour = require('../../models/CandleHour');
const InstrumentNew = require('../../models/InstrumentNew');

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

  if (startTime && !moment(startTime).isValid()) {
    return res.json({
      status: false,
      message: 'Invalid startTime',
    });
  }

  if (endTime && !moment(endTime).isValid()) {
    return res.json({
      status: false,
      message: 'Invalid endTime',
    });
  }

  const instrumentDoc = await InstrumentNew.findById(instrumentId, {
    name: 1,
    is_active: 1,
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

  const matchObj = {
    instrument_id: instrumentId,
  };

  if (startTime && endTime) {
    const momentEndTime = moment(endTime).startOf('hour');
    const momentStartTime = moment(startTime).startOf('hour');

    const startTimeMinusExtraTime = momentStartTime.add(-5, 'hours');
    const endTimePlusExtraTime = momentEndTime.add(6, 'hours');

    matchObj.$and = [{
      time: {
        $gte: startTimeMinusExtraTime,
      },
    }, {
      time: {
        $lte: endTimePlusExtraTime,
      },
    }];
  }

  const candlesDocs = await CandleHour
    .find(matchObj)
    .sort({ time: 1 })
    .exec();

  return res.json({
    status: true,
    result: candlesDocs.map(doc => doc._doc),
  });
};
