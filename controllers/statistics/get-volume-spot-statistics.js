const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const {
  getActiveInstruments,
} = require('../instruments/utils/get-active-instruments');

const {
  PERIOD_FOR_COLLECT_SPOT_VOLUME_STATISTICS,
} = require('./constants');

module.exports = async (req, res, next) => {
  const {
    query: {
      instrumentId,
    },

    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  if (instrumentId && !isMongoId(instrumentId)) {
    return res.json({
      status: false,
      message: 'Invalid instrumentId',
    });
  }

  let {
    startDate,
    endDate,
  } = req.query;

  if (startDate) {
    if (!moment(startDate).isValid()) {
      return res.json({
        status: false,
        message: 'Invalid startDate',
      });
    }

    startDate = moment(startDate).utc();
  } else {
    // todo: add constant
    startDate = moment().utc()
      .add(-PERIOD_FOR_COLLECT_SPOT_VOLUME_STATISTICS, 'seconds');
  }

  if (endDate) {
    if (!moment(endDate).isValid()) {
      return res.json({
        status: false,
        message: 'Invalid endDate',
      });
    }

    endDate = moment(endDate).utc();
  } else {
    endDate = moment().utc().startOf('hour');
  }

  const instrumentsIds = [];

  if (instrumentId) {
    instrumentsIds.push(instrumentId);
  } else {
    const resultGetInstruments = await getActiveInstruments({
      isOnlySpot: true,
    });

    if (!resultGetInstruments || !resultGetInstruments.status) {
      return res.json({
        status: false,
        message: resultGetInstruments.message || 'Cant getActiveInstruments',
      });
    }

    const instrumentsDocs = resultGetInstruments.result;
    instrumentsDocs.forEach(doc => instrumentsIds.push(doc._id));
  }

  if (!instrumentsIds || !instrumentsIds.length) {
    return res.json({
      status: true,
      result: [],
    });
  }

  return res.json({
    status: true,
  });
};
