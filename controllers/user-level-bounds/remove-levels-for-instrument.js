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

  await UserLevelBound.updateMany({
    user_id: user._id,
    instrument_id: instrumentId,
    is_worked: false,
  }, {
    is_worked: true,
    worked_at: new Date(),
  });

  return res.json({
    status: true,
  });
};
