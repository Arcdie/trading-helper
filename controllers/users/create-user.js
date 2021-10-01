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

  const doesExistUserWithThisName = await User.exists({
    fullname,
  });

  if (doesExistUserWithThisName) {
    return res.json({
      status: false,
      text: 'User with this name already exists',
    });
  }

  const newUser = new User({
    fullname,
    password,
  });

  await newUser.save();

  const newToken = createToken({ _id: newUser._id.toString() });

  res
    .cookie('token', newToken, { maxAge: jwtConf.lifetime, httpOnly: true })
    .json({ status: true });
};
