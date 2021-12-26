const log = require('../../../libs/logger')(module);

const {
  TYPES_STATISTICS,
} = require('./constants');

const {
  STRATEGIES,
} = require('../../strategies/constants');

module.exports = async (req, res, next) => {
  try {
    const {
      params: {
        strategy,
      },

      user,
    } = req;

    if (!user) {
      return res.redirect('/');
    }

    if (!strategy || !STRATEGIES.get(strategy)) {
      const message = 'No or invalid strategy';

      log.warn(message);
      return res.json({
        status: false,
        message,
      });
    }

    res.render(`web/statistics/${strategy}-page`);
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
