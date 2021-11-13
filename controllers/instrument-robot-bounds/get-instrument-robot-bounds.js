const {
  isMongoId,
} = require('validator');

const {
  getInstrumentRobotBounds,
} = require('./utils/get-instrument-robot-bounds');

module.exports = async (req, res, next) => {
  const {
    query: {
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

  const resultGetInstrumentRobotBounds = await getInstrumentRobotBounds({
    instrumentId,
  });

  if (!resultGetInstrumentRobotBounds || !resultGetInstrumentRobotBounds.status) {
    return res.json({
      status: false,
      message: resultGetInstrumentRobotBounds.message || 'Cant getInstrumentRobotBounds',
    });
  }

  return res.json({
    status: true,
    result: resultGetInstrumentRobotBounds.result,
  });
};
