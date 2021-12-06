const {
  isEmpty,
} = require('lodash');

const log = require('../../libs/logger')(module);

const User = require('../../models/User');

module.exports = async (req, res, next) => {
  try {
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
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
