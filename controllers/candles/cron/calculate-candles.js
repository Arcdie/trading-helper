const log = require('../../../libs/logger');

const {
  calculate1hCandle,
} = require('../utils/calculate-1h-candle');

const {
  calculate4hCandle,
} = require('../utils/calculate-4h-candle');

const {
  calculate1dCandle,
} = require('../utils/calculate-1d-candle');

const {
  getActiveInstruments,
} = require('../../instruments/utils/get-active-instruments');

const {
  INTERVALS,
} = require('../constants');

module.exports = async (req, res, next) => {
  const {
    query: {
      interval,
    },
  } = req;

  if (!interval || !INTERVALS.get(interval)) {
    return res.json({
      status: false,
      message: 'No or invalid interval',
    });
  }

  const resultGetInstruments = await getActiveInstruments({
    isOnlyFutures: true,
  });

  if (!resultGetInstruments || !resultGetInstruments.status) {
    return res.json({
      status: false,
      message: resultGetInstruments.message || 'Cant getActiveInstruments',
    });
  }

  let execFunc;

  if (interval === INTERVALS.get('1h')) {
    execFunc = calculate1hCandle;
  } else if (interval === INTERVALS.get('4h')) {
    execFunc = calculate4hCandle;
  } else if (interval === INTERVALS.get('1d')) {
    execFunc = calculate1dCandle;
  }

  for (const instrumentDoc of resultGetInstruments.result) {
    const resultCreateCandle = await execFunc({
      instrumentId: instrumentDoc._id,
    });

    if (!resultCreateCandle || !resultCreateCandle.status) {
      log.warn(resultCreateCandle.message || 'Cant execFunc');
      return null;
    }
  }

  return res.json({
    status: true,
  });
};
