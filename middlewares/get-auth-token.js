const {
  verifyToken,
} = require('../libs/jwt');

module.exports = (req, res, next) => {
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
};
