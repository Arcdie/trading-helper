const log = require('../../../libs/logger')(module);

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
  try {
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

    res.json({
      status: true,
    });

    const resultGetInstruments = await getActiveInstruments({
      isOnlyFutures: true,
    });

    if (!resultGetInstruments || !resultGetInstruments.status) {
      log.warn(resultGetInstruments.message || 'Cant getActiveInstruments');
      return false;
    }

    let execFunc;

    if (interval === INTERVALS.get('4h')) {
      execFunc = calculate4hCandle;
    } else if (interval === INTERVALS.get('1d')) {
      execFunc = calculate1dCandle;
    }

    for await (const instrumentDoc of resultGetInstruments.result) {
      const resultCreateCandle = await execFunc({
        instrumentId: instrumentDoc._id,
      });

      if (!resultCreateCandle || !resultCreateCandle.status) {
        log.warn(resultCreateCandle.message || 'Cant execFunc');
        return null;
      }
    }
  } catch (error) {
    log.warn(error.message);

    res.json({
      status: false,
      message: error.message,
    });
  }
};
