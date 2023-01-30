const {
  isMongoId,
} = require('validator');

const log = require('../../libs/logger')(module);

const {
  updateInstrument,
} = require('./utils/update-instrument');

const {
  renewInstrumentsInRedis,
} = require('./utils/renew-instruments-in-redis');

const InstrumentNew = require('../../models/InstrumentNew');

module.exports = async (req, res, next) => {
  try {
    const {
      body: {
        instrumentsIds,
        doesIgnoreVolume,
      },

      user,
    } = req;

    if (!user) {
      return res.json({
        status: false,
        message: 'Not authorized',
      });
    }

    if (!instrumentsIds || !Array.isArray(instrumentsIds) || !instrumentsIds.length) {
      return res.json({
        status: false,
        message: 'No or invalid instrumentsIds',
      });
    }

    let doesInstrumentsIdsValid = true;

    instrumentsIds.forEach(instrumentId => {
      const doesValid = isMongoId(instrumentId);

      if (!doesValid) {
        doesInstrumentsIdsValid = false;
        return false;
      }
    });

    if (!doesInstrumentsIdsValid) {
      return res.json({
        status: false,
        message: 'Invalid instrumentsIds',
      });
    }

    await Promise.all(instrumentsIds.map(async instrumentId => {
      const resultUpdate = await updateInstrument({
        instrumentId,
        doesIgnoreVolume: Boolean(doesIgnoreVolume),
      });

      if (!resultUpdate) {
        log.warn(resultUpdate.message || 'Cant updateInstrument');
        return null;
      }
    }));

    const resultRenewInstruments = await renewInstrumentsInRedis();

    if (!resultRenewInstruments || !resultRenewInstruments.status) {
      const message = resultRenewInstruments.message || 'Cant renewInstrumentsInRedis';
      log.warn(message);

      return res.json({
        status: false,
        message,
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
