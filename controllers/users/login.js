const log = require('../../libs/logger')(module);

const {
  jwtConf,
} = require('../../config');

const {
  createToken,
} = require('../../libs/jwt');

const User = require('../../models/User');

module.exports = async (req, res, next) => {
  try {
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

    const userDoc = await User.findOne({
      fullname,
      password,
    }, { password: 0 }).exec();

    if (!userDoc) {
      return res.json({
        status: false,
        message: 'No user with these login & password',
      });
    }

    const newToken = createToken({ _id: userDoc._id.toString() });

    res
      .cookie('token', newToken, { maxAge: jwtConf.lifetime, httpOnly: true })
      .json({
        status: true,
        result: userDoc._doc,
      });
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
