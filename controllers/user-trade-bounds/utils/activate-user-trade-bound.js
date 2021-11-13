const {
  createStopLossOrder,
} = require('./create-stoploss-order');

const UserTradeBound = require('../../../models/UserTradeBound');

const activateUserTradeBound = async ({
  instrumentName,
  instrumentPrice,
  binanceTradeId,
}) => {
  if (!instrumentName) {
    return {
      status: false,
      message: 'No instrumentName',
    };
  }

  if (!instrumentPrice) {
    return {
      status: false,
      message: 'No instrumentPrice',
    };
  }

  if (!binanceTradeId) {
    return {
      status: false,
      message: 'No binanceTradeId',
    };
  }

  const userTradeBound = await UserTradeBound.findOne({
    binance_trade_id: binanceTradeId,
  }, {
    is_long: 1,
    buy_price: 1,
    sell_price: 1,
    is_active: 1,
  }).exec();

  if (!userTradeBound) {
    return { status: true };
  }

  if (userTradeBound.is_active) {
    return {
      status: false,
      message: 'UserTradeBound is already active',
    };
  }

  userTradeBound.is_active = true;
  userTradeBound.trade_started_at = new Date();

  if (userTradeBound.is_long) {
    userTradeBound.buy_price = parseFloat(instrumentPrice);
  } else {
    userTradeBound.sell_price = parseFloat(instrumentPrice);
  }

  await userTradeBound.save();

  const resultCreateStopLossOrder = await createStopLossOrder({
    instrumentName,
    instrumentPrice,
    userTradeBoundId: userTradeBound._id,
  });

  if (!resultCreateStopLossOrder || !resultCreateStopLossOrder.status) {
    return {
      status: false,
      message: resultCreateStopLossOrder.message || 'Cant createStopLossOrder (active bound)',
    };
  }

  return {
    status: true,
  };
};

module.exports = {
  activateUserTradeBound,
};
