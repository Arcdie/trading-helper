const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const Candle = require('../../models/Candle');
const InstrumentNew = require('../../models/InstrumentNew');

module.exports = async (req, res, next) => {
  const {
    query: {
      instrumentId,
      startTime,
      endTime,
      limit,
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
    const momentStartTime = moment(startTime).startOf('minute');
    const momentEndTime = moment(endTime).startOf('minute');

    matchObj.$and = [{
      time: {
        $gt: momentStartTime,
      },
    }, {
      time: {
        $lt: momentEndTime,
      },
    }];
  } else if (startTime) {
    const momentStartTime = moment(startTime).startOf('minute');

    matchObj.time = {
      $gt: momentStartTime,
    };
  } else if (endTime) {
    const momentEndTime = moment(endTime).startOf('minute');

    matchObj.time = {
      $lt: momentEndTime,
    };
  }

  const Query = Candle
    .find(matchObj)
    .sort({ time: -1 });

  if (limit) {
    Query.limit(parseInt(limit, 10));
  }

  const candlesDocs = await Query.exec();

  return res.json({
    status: true,
    result: candlesDocs.map(doc => doc._doc),
  });
};
