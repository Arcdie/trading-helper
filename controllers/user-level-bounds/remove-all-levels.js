const UserLevelBound = require('../../models/UserLevelBound');

module.exports = async (req, res, next) => {
  const {
    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  await UserLevelBound.updateMany({
    user_id: user._id,
    is_worked: false,
  }, {
    is_worked: true,
    worked_at: new Date(),
  });

  return res.json({
    status: true,
  });
};
