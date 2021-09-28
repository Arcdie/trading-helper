const User = require('../../models/User');

module.exports = async (req, res, next) => {
  const {
    params: {
      userid,
    },
  } = req;

  if (!userid) {
    return res.json({
      status: false,
      text: 'No userid',
    });
  }

  const userDoc = await User.findById(userid).exec();

  return res.json({
    status: true,
    result: userDoc._doc,
  });
};
