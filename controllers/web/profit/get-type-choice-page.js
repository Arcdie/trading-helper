const log = require('../../../libs/logger')(module);

const {
  TYPES_STATISTICS,
} = require('../statistics/constants');

const {
  STRATEGIES,
} = require('../../strategies/constants');

module.exports = async (req, res, next) => {
  try {
    const {
      params: {
        type,
        strategy,
      },

      user,
    } = req;

    if (!user) {
      return res.redirect('/');
    }

    if (!type || !TYPES_STATISTICS.get(type)) {
      const message = 'No or invalid type';

      log.warn(message);
      return res.json({
        status: false,
        message,
      });
    }

    if (!strategy || !STRATEGIES.get(strategy)) {
      const message = 'No or invalid strategy';

      log.warn(message);
      return res.json({
        status: false,
        message,
      });
    }

    res.render(`web/profit/${type}/${strategy}-page`);
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
