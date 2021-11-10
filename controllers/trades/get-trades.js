const {
  isMongoId,
} = require('validator');

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

  const targetTrades = await Trade.find({
    instrument_id: instrumentId,
  }).exec();

  return res.json({
    status: true,
    result: targetTrades.map(doc => doc._doc),
  });
};
