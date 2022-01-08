const {
  isMongoId,
} = require('validator');

const log = require('../../libs/logger')(module);

const {
  createUserTradeBoundForStatistics,
} = require('./utils/create-user-trade-bound-for-statistics');

module.exports = async (req, res, next) => {
  try {
    const {
      body: {
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

    if (!instrumentId || !isMongoId(instrumentId)) {
      return res.json({
        status: false,
        message: 'No or invalid instrumentId',
      });
    }

    const resultCreateBound = await createUserTradeBoundForStatistics(req.body);

    if (!resultCreateBound || !resultCreateBound.status) {
      const message = resultCreateBound.message || 'Cant createUserTradeBoundForStatistics';

      log.warn(message);

      return res.json({
        status: false,
        message,
      });
    }

    return res.json({
      status: true,
      result: resultCreateBound.result,
    });
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
