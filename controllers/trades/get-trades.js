const {
  isMongoId,
} = require('validator');

const {
  getInstrumentRobotBounds,
} = require('../instrument-robot-bounds/utils/get-instrument-robot-bounds');

const Trade = require('../../models/Trade');

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

  const resultGetBounds = await getInstrumentRobotBounds({
    instrumentId,
  });

  if (!resultGetBounds || !resultGetBounds.status) {
    return res.json({
      status: false,
      message: resultGetBounds.message || 'Cant getInstrumentRobotBounds',
    });
  }

  if (!resultGetBounds.result || !resultGetBounds.result.length) {
    return res.json({
      status: true,
      result: [],
    });
  }

  const targetQuantities = [];

  resultGetBounds.result.forEach(bound => {
    targetQuantities.push({
      is_long: bound.is_long,
      quantity: bound.quantity,
    });
  });

  const targetTrades = await Trade.find({
    instrument_id: instrumentId,
    $or: targetQuantities,
  }).exec();

  return res.json({
    status: true,
    result: targetTrades.map(doc => doc._doc),
  });
};
