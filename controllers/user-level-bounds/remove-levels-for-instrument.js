const {
  isMongoId,
} = require('validator');

const UserLevelBound = require('../../models/UserLevelBound');

module.exports = async (req, res, next) => {
  const {
    body: {
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

  await UserLevelBound.deleteMany({
    user_id: user._id,
    instrument_id: instrumentId,
  });

  return res.json({
    status: true,
  });
};
