const {
  createStopLossOrder,
} = require('./create-stoploss-order');

const UserTradeBound = require('../../../models/UserTradeBound');

const activateUserTradeBound = async ({
  price,
  instrumentName,
  binanceTradeId,
}) => {
  if (!instrumentName) {
    return {
      status: false,
      message: 'No instrumentName',
    };
  }

  if (!price) {
    return {
      status: false,
      message: 'No price',
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

  if (userTradeBound.is_long) {
    userTradeBound.buy_price = parseFloat(price);
  } else {
    userTradeBound.sell_price = parseFloat(price);
  }

  await userTradeBound.save();

  const resultCreateStopLossOrder = await createStopLossOrder({
    instrumentName,
    userTradeBoundId: userTradeBound._id,
  });

  if (!resultCreateStopLossOrder || !resultCreateStopLossOrder.status) {
    return {
      status: false,
      message: resultCreateStopLossOrder.message || 'Cant createStopLossOrder',
    };
  }

  return {
    status: true,
  };
};

module.exports = {
  activateUserTradeBound,
};
