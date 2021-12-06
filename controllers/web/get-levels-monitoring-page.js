const log = require('../../libs/logger')(module);

module.exports = async (req, res, next) => {
  try {
    const {
      user,
    } = req;

    if (!user) {
      return res.redirect('/');
    }

    res.render('web/levels-monitoring-page');
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
