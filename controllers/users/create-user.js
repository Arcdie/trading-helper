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
      message: 'No fullname',
    });
  }

  if (!password) {
    return res.json({
      status: false,
      message: 'No password',
    });
  }

  const doesExistUserWithThisName = await User.exists({
    fullname,
  });

  if (doesExistUserWithThisName) {
    return res.json({
      status: false,
      message: 'User with this name already exists',
    });
  }

  const newUser = new User({
    fullname,
    password,
  });

  if (!newUser.settings) {
    newUser.settings = {};
  }

  if (!newUser.levels_monitoring_settings) {
    newUser.levels_monitoring_settings = {};
  }

  await newUser.save();

  const newToken = createToken({ _id: newUser._id.toString() });

  delete newUser._doc.password;

  res
    .cookie('token', newToken, { maxAge: jwtConf.lifetime, httpOnly: true })
    .json({
      status: true,
      result: newUser._doc,
    });
};
