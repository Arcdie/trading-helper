const log = require('../libs/logger')(module);

const {
  getById,
} = require('../controllers/users/utils/get-by-id');

module.exports = async (req, res, next) => {
  try {
    const {
      user,
    } = req;

    if (!user) {
      return res.redirect('/');
    }

    const resultGet = await getById({
      userId: user._id,
    });

    if (!resultGet || !resultGet.status) {
      return res.json({
        status: false,
        message: resultGet.message || 'Cant getById',
      });
    }

    req.user = resultGet.result;
    res.locals.user = req.user;

    return next();
  } catch (error) {
    log.warn(error.message);

    return {
      status: false,
      message: error.message,
    };
  }
};
