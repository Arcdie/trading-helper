const log = require('../../libs/logger')(module);

const {
  removeAllFigureLevelsForUser,
} = require('./utils/remove-all-figure-levels-for-user');

module.exports = async (req, res, next) => {
  try {
    const {
      user,
    } = req;

    if (!user) {
      return res.json({
        status: false,
        message: 'Not authorized',
      });
    }

    const resultRemove = await removeAllFigureLevelsForUser({
      userId: user._id.toString(),
    });

    if (!resultRemove || !resultRemove.status) {
      return res.json({
        status: false,
        message: resultRemove.message || 'Cant removeAllFigureLevelsForUser',
      });
    }

    return res.json({
      status: true,
    });
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
