const {
  isMongoId,
} = require('validator');

const {
  isUndefined,
} = require('lodash');

const log = require('../../../libs/logger')(module);

const {
  DIVIDER_FOR_SPOT_VOLUME,
  DIVIDER_FOR_FUTURES_VOLUME,
} = require('../constants');

const InstrumentVolumeBound = require('../../../models/InstrumentVolumeBound');

const createInstrumentVolumeBound = async ({
  instrumentId,
  isFutures,

  price,
  startQuantity,
  averageVolumeForLast24Hours,
  averageVolumeForLast15Minutes,

  isAsk,
}) => {
  try {
    if (!instrumentId || !isMongoId(instrumentId.toString())) {
      return {
        status: false,
        message: 'No or invalid instrumentId',
      };
    }

    if (!price) {
      return {
        status: false,
        message: 'No or invalid price',
      };
    }

    if (!startQuantity) {
      return {
        status: false,
        message: 'No or invalid startQuantity',
      };
    }

    if (!averageVolumeForLast15Minutes) {
      return {
        status: false,
        message: 'No or invalid averageVolumeForLast15Minutes',
      };
    }

    if (!averageVolumeForLast24Hours) {
      return {
        status: false,
        message: 'No or invalid averageVolumeForLast24Hours',
      };
    }

    if (isUndefined(isAsk)) {
      return {
        status: false,
        message: 'No or invalid isAsk',
      };
    }

    if (isUndefined(isFutures)) {
      return {
        status: false,
        message: 'No or invalid isFutures',
      };
    }

    const boundWithThisPrice = await InstrumentVolumeBound.findOne({
      instrument_id: instrumentId,
      price,
      is_active: true,
    }).exec();

    if (boundWithThisPrice) {
      return {
        status: true,
        result: boundWithThisPrice._doc,
      };
    }

    const newBound = new InstrumentVolumeBound({
      instrument_id: instrumentId,
      price,
      start_quantity: startQuantity,
      average_volume_for_last_15_minutes: averageVolumeForLast15Minutes,
      average_volume_for_last_24_hours: averageVolumeForLast24Hours,
      is_ask: isAsk,
      is_futures: isFutures,
      volume_started_at: new Date(),
    });

    if (!isFutures) {
      newBound.min_quantity_for_cancel = parseInt(averageVolumeForLast24Hours / DIVIDER_FOR_SPOT_VOLUME, 10);
    } else {
      newBound.min_quantity_for_cancel = parseInt(averageVolumeForLast24Hours / DIVIDER_FOR_FUTURES_VOLUME, 10);
    }

    await newBound.save();

    return {
      status: true,
      result: newBound._doc,
    };
  } catch (error) {
    log.warn(error.message);

    return {
      status: false,
      message: error.message,
    };
  }
};

module.exports = {
  createInstrumentVolumeBound,
};
