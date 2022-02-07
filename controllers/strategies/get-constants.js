const log = require('../../libs/logger')(module);

const constants = require('./constants');

module.exports = async (req, res, next) => {
  try {
    constants.STRATEGIES = [...constants.STRATEGIES.values()];

    return res.json({
      status: true,
      result: constants,
    });
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
