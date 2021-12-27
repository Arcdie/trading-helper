const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const log = require('../../libs/logger')(module);

const {
  TYPES_TRADES,
} = require('./constants');

const UserTradeBoundStatistics = require('../../models/UserTradeBoundStatistics');

module.exports = async (req, res, next) => {
  try {
    const {
      body: {

      },

      user,
    } = req;

    if (!user) {
      return res.json({
        status: false,
        message: 'Not authorized',
      });
    }

    return res.json({
      status: true,
      result: {},
    });
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
