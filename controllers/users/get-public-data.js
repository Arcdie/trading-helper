const {
  isEmpty,
} = require('lodash');

const User = require('../../models/User');

module.exports = async (req, res, next) => {
  const {
    query: {
      fullname,
    },
  } = req;

  const searchObj = {};

  if (fullname) {
    searchObj.fullname = fullname;
  }

  if (isEmpty(searchObj)) {
    return res.json({
      status: false,
      message: 'Empty searchObj',
    });
  }

  const userDoc = await User.findOne(searchObj, {
    _id: 1,
  }).exec();

  if (!userDoc) {
    return res.json({
      status: true,
      result: null,
    });
  }

  return res.json({
    status: true,
    result: userDoc._doc,
  });
};
