const log = require('../../../libs/logger')(module);

const UserBinanceBound = require('../../../models/UserBinanceBound');

const getActiveUserBinanceBounds = async () => {
  try {
    const userBinanceBounds = await UserBinanceBound.find({
      is_active: true,
    }).exec();

    return {
      status: true,
      result: userBinanceBounds.map(bound => bound._doc),
    };
  } catch (error) {
    log.warn(error.message);

    return {
      status: false,
      message: error.message,
    };
  }
};

module.exports = {
  getActiveUserBinanceBounds,
};
