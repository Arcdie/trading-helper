const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const {
  getActiveInstruments,
} = require('../instruments/utils/get-active-instruments');

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

    startDate = moment(startDate);
  } else {
    // todo: add constant
    startDate = moment();
  }

  if (endDate) {
    if (!moment(endDate).isValid()) {
      return res.json({
        status: false,
        message: 'Invalid endDate',
      });
    }

    endDate = moment(endDate);
  } else {
    // todo: add constant
    endDate = moment();
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

    if (!instrumentsDocs || !instrumentsDocs.length) {
      return {
        status: true,
        result: [],
      };
    }

    instrumentsDocs.forEach(doc => instrumentsIds.push(doc._id));
  }


};
