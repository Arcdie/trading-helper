const log = require('../../libs/logger')(module);

module.exports = async (req, res, next) => {
  try {
    const {
      user,
    } = req;

    if (!user) {
      res.redirect('/auth/login');
    } else {
      res.redirect('/profile');
    }
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
