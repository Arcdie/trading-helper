const UserBinanceBound = require('../../../models/UserBinanceBound');

const getActiveUserBinanceBounds = async () => {
  const userBinanceBounds = await UserBinanceBound.find({
    is_active: true,
  }).exec();

  return {
    status: true,
    result: userBinanceBounds.map(bound => bound._doc),
  };
};

module.exports = {
  getActiveUserBinanceBounds,
};
