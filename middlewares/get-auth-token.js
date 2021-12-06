const log = require('../libs/logger')(module);

const {
  verifyToken,
} = require('../libs/jwt');

module.exports = (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.token;

    if (!token) {
      return next();
    }

    const verifiedToken = verifyToken(token);

    if (!verifiedToken) {
      res.clearCookie('token');
      return res.redirect('/auth/login');
    }

    req.user = {
      _id: verifiedToken._id,
    };

    return next();
  } catch (error) {
    log.warn(error.message);

    return {
      status: false,
      message: error.message,
    };
  }
};
