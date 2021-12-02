const {
  isMongoId,
} = require('validator');

const log = require('../../libs/logger');

const {
  updateInstrument,
} = require('./utils/update-instrument');

const {
  getActiveInstruments,
} = require('./utils/get-active-instruments');

const {
  renewInstrumentsInRedis,
} = require('./utils/renew-instruments-in-redis');

module.exports = async (req, res, next) => {
  const {
    body: {
      instrumentsIds,
    },

    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  if (!instrumentsIds || !Array.isArray(!instrumentsIds) || !instrumentsIds.length) {
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

  const resultGetInstruments = await getActiveInstruments({});

  if (!resultGetInstruments || !resultGetInstruments.status) {
    const message = resultGetInstruments.message || 'Cant getActiveInstruments';
    log.warn(message);

    return res.json({
      status: false,
      message,
    });
  }

  await Promise.all(resultGetInstruments.result.map(async doc => {
    const doesIgnoreVolume = instrumentsIds.includes(doc._id.toString());

    const resultUpdate = await updateInstrument({
      instrumentId: doc._id,
      doesIgnoreVolume,
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
};
