const log = require('../../libs/logger')(module);

const {
  renewInstrumentsInRedis,
} = require('./utils/renew-instruments-in-redis');

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

    const resultRenewInstruments = await renewInstrumentsInRedis();

    if (!resultRenewInstruments || !resultRenewInstruments.status) {
      return res.json({
        status: false,
        message: resultRenewInstruments.message || 'Cant renewInstrumentsInRedis',
      });
    }

    return res.json({
      status: true,
    });
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
