const {
  jwtConf,
} = require('../../config');

const {
  createToken,
} = require('../../libs/jwt');

const User = require('../../models/User');

module.exports = async (req, res, next) => {
  const {
    body: {
      fullname,
      password,
    },
  } = req;

  if (!fullname) {
    return res.json({
      status: false,
      text: 'No fullname',
    });
  }

  if (!password) {
    return res.json({
      status: false,
      text: 'No password',
    });
  }

  const userDoc = await User.findOne({
    fullname,
    password,
  }).exec();

  if (!userDoc) {
    return res.json({
      status: false,
      text: 'No user with these login & password',
    });
  }

  const newToken = createToken({ _id: userDoc._id.toString() });

  res
    .cookie('token', newToken, { maxAge: jwtConf.lifetime, httpOnly: true })
    .json({ status: true });
};
