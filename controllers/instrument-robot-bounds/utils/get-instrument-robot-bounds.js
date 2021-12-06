const {
  isMongoId,
} = require('validator');

const log = require('../../../libs/logger')(module);

const InstrumentRobotBound = require('../../../models/InstrumentRobotBound');

const getInstrumentRobotBounds = async ({
  instrumentId,
}) => {
  try {
    if (!instrumentId || !isMongoId(instrumentId.toString())) {
      return {
        status: false,
        message: 'No or invalid instrumentId',
      };
    }

    const instrumentRobotBounds = await InstrumentRobotBound.find({
      instrument_id: instrumentId,
      is_active: true,
    }).exec();

    return {
      status: true,
      result: instrumentRobotBounds.map(bound => bound._doc),
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
  getInstrumentRobotBounds,
};
