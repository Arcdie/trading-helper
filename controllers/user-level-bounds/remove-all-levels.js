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

  await UserLevelBound.deleteMany({
    user_id: user._id,
  });

  return res.json({
    status: true,
  });
};
