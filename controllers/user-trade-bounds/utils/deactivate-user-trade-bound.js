const UserTradeBound = require('../../../models/UserTradeBound');

const deactivateUserTradeBound = async ({
  instrumentPrice,
  binanceStopLossTradeId,
}) => {
  if (!instrumentPrice) {
    return {
      status: false,
      message: 'No instrumentPrice',
    };
  }

  if (!binanceStopLossTradeId) {
    return {
      status: false,
      message: 'No binanceStopLossTradeId',
    };
  }

  const userTradeBound = await UserTradeBound.findOne({
    binance_stoploss_trade_id: binanceStopLossTradeId,
  }, {
    is_long: 1,
    buy_price: 1,
    sell_price: 1,
    is_active: 1,
    trade_ended_at: 1,
  }).exec();

  if (!userTradeBound) {
    return {
      status: false,
      message: 'No UserTradeBound (deactivate bound)',
    };
  }

  if (!userTradeBound.is_active) {
    return {
      status: false,
      message: 'UserTradeBound is not active (deactivate bound)',
    };
  }

  userTradeBound.is_active = false;
  userTradeBound.trade_ended_at = new Date();

  if (userTradeBound.is_long) {
    userTradeBound.sell_price = parseFloat(instrumentPrice);
  } else {
    userTradeBound.buy_price = parseFloat(instrumentPrice);
  }

  await userTradeBound.save();

  return {
    status: true,
  };
};

module.exports = {
  deactivateUserTradeBound,
};
