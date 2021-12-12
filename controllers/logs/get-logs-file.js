const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const log = require('../../libs/logger')(module);

const {
  TYPES_LOGS,
} = require('./constants');

module.exports = async (req, res, next) => {
  try {
    const {
      query: {
        typeLogs,
      },

      user,
    } = req;

    if (!user) {
      return res.json({
        status: false,
        message: 'Not authorized',
      });
    }

    if (!typeLogs || !TYPES_LOGS.get(typeLogs)) {
      return res.json({
        status: false,
        message: 'No or invalid typeLogs',
      });
    }

    return res.json({
      status: true,
      // result: userTradeBounds.map(doc => doc._doc),
    });
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
