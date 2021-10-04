const {
  isMongoId,
} = require('validator');

const UserLevelBound = require('../../models/UserLevelBound');

module.exports = async (req, res, next) => {
  const {
    body: {
      instrumentId,
      priceOriginal,
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

  if (!priceOriginal) {
    return res.json({
      status: false,
      message: 'No priceOriginal',
    });
  }

  await UserLevelBound.findOneAndUpdate({
    user_id: user._id,
    instrument_id: instrumentId,
    price_original: priceOriginal,
    is_worked: false,
  }, {
    is_worked: true,
    worked_at: new Date(),
  });

  return res.json({
    status: true,
  });
};
