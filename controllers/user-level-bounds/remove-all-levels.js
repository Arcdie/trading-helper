const {
  removeAllLevels,
} = require('./utils/remove-all-levels');

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

  const resultRemove = await removeAllLevels({
    userId: user._id,
  });

  if (!resultRemove || !resultRemove.status) {
    return res.json({
      status: false,
      message: resultRemove.message || 'Cant removeAllLevels',
    });
  }

  return res.json({
    status: true,
  });
};
