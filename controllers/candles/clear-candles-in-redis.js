const log = require('../../libs/logger')(module);

const {
  clearCandlesInRedis,
} = require('./utils/clear-candles-in-redis');

module.exports = async (req, res, next) => {
  try {
    const {
      user,
    } = req;

    if (!user) {
      return res.json({
        status: false,
        message: 'Not authorized',
      });
    }

    const resultClear = await clearCandlesInRedis({});

    if (!resultClear || !resultClear.status) {
      return res.json({
        status: false,
        message: resultClear.message || 'Cant clearCandlesInRedis',
      });
    }

    return res.json({
      status: true,
    });
  } catch (error) {
    log.error(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
