const log = require('../../../libs/logger')(module);

const InstrumentNew = require('../../../models/InstrumentNew');
const InstrumentTrend = require('../../../models/InstrumentTrend');

const createInstrument = async ({
  name,
  price,

  tickSize,
  stepSize,
  pricePrecision,

  isFutures,
}) => {
  try {
    if (!name) {
      return {
        status: false,
        message: 'No name',
      };
    }

    if (!price) {
      return {
        status: false,
        message: 'No price',
      };
    }

    if (!stepSize) {
      return {
        status: false,
        message: 'No stepSize',
      };
    }

    if (!tickSize) {
      return {
        status: false,
        message: 'No tickSize',
      };
    }

    const instrumentDoc = await InstrumentNew.findOne({
      name,
    }).exec();

    if (instrumentDoc) {
      return {
        status: true,
        isCreated: false,
        result: instrumentDoc._doc,
      };
    }

    const newInstrument = new InstrumentNew({
      name,
      price,

      tick_size: tickSize,
      step_size: stepSize,

      is_active: true,
      is_futures: isFutures || false,
    });

    if (pricePrecision) {
      newInstrument.price_precision = parseFloat(pricePrecision);
    }

    await newInstrument.save();

    /*
    const newInstrumentTrend = new InstrumentTrend({
      instrument_id: newInstrument._id,
    });

    await newInstrumentTrend.save();
    */

    return {
      status: true,
      isCreated: true,
      result: newInstrument._doc,
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
  createInstrument,
};
