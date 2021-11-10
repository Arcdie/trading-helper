const {
  isMongoId,
} = require('validator');

const InstrumentRobotBound = require('../../../models/InstrumentRobotBound');

const getInstrumentRobotBounds = async ({
  instrumentId,
}) => {
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
};

module.exports = {
  getInstrumentRobotBounds,
};
