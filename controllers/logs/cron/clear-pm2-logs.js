const log = require('../../../libs/logger')(module);

module.exports = async (req, res, next) => {
  try {
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
