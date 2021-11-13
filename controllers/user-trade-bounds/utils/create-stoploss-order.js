const crypto = require('crypto');

const {
  isMongoId,
} = require('validator');

const {
  newOrder,
} = require('../../binance/utils/futures/new-order');

const {
  cancelOrder,
} = require('../../binance/utils/futures/cancel-order');

const {
  getPrecision,
} = require('../../../libs/support');

const UserTradeBound = require('../../../models/UserTradeBound');
const UserBinanceBound = require('../../../models/UserBinanceBound');

const createStopLossOrder = async ({
  instrumentName,
  instrumentPrice,
  userTradeBoundId,
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

  if (!userTradeBoundId || !isMongoId(userTradeBoundId.toString())) {
    return {
      status: false,
      message: 'No or invalid userTradeBoundId',
    };
  }

  const userTradeBound = await UserTradeBound.findById(userTradeBoundId).exec();

  if (!userTradeBound) {
    return {
      status: false,
      message: 'No UserTradeBound',
    };
  }

  if (!userTradeBound.is_active) {
    return {
      status: false,
      message: 'UserTradeBound is not active',
    };
  }

  const userBinanceBound = await UserBinanceBound.findOne({
    user_id: userTradeBound.user_id,
    is_active: true,
  }).exec();

  if (!userBinanceBound) {
    return {
      status: false,
      message: 'No active UserBinanceBound',
    };
  }

  const price = userTradeBound.is_long ? userTradeBound.buy_price : userTradeBound.sell_price;
  const precision = getPrecision(price);

  if (!userTradeBound.binance_stoploss_trade_id) {
    const profitStepSize = parseFloat((price * (userTradeBound.stoploss_percent / 100)).toFixed(precision));

    userTradeBound.profit_step_size = profitStepSize;

    if (userTradeBound.is_long) {
      userTradeBound.stoploss_price = price - profitStepSize;
      userTradeBound.takeprofit_price = price + profitStepSize;
    } else {
      userTradeBound.stoploss_price = price + profitStepSize;
      userTradeBound.takeprofit_price = price - profitStepSize;
    }

    userTradeBound.stoploss_price = parseFloat(userTradeBound.stoploss_price.toFixed(precision));
    userTradeBound.takeprofit_price = parseFloat(userTradeBound.takeprofit_price.toFixed(precision));
  } else {
    let incrValue = 0;
    let newStopLoss;
    let newTakeProfit;

    if (userTradeBound.is_long) {
      while (1) {
        newTakeProfit = price + (userTradeBound.profit_step_size * incrValue);
        if (newTakeProfit > instrumentPrice) break;
        incrValue += 1;
      }

      newStopLoss = (newTakeProfit - (userTradeBound.profit_step_size * 2));
    } else {
      while (1) {
        newTakeProfit = price - (userTradeBound.profit_step_size * incrValue);
        if (newTakeProfit < instrumentPrice) break;
        incrValue += 1;
      }

      newStopLoss = (newTakeProfit + (userTradeBound.profit_step_size * 2));
    }

    newTakeProfit = parseFloat(newTakeProfit.toFixed(precision));

    if (newTakeProfit === userTradeBound.takeprofit_price) {
      return {
        status: true,
      };
    }

    userTradeBound.takeprofit_price = newTakeProfit;
    userTradeBound.stoploss_price = parseFloat(newStopLoss.toFixed(precision));

    const timestamp = new Date().getTime();
    let signatureStr = `timestamp=${timestamp}`;

    const obj = {
      symbol: instrumentName.replace('PERP', ''),
      orderId: userTradeBound.binance_stoploss_trade_id,
    };

    Object.keys(obj).forEach(key => {
      signatureStr += `&${key}=${obj[key]}`;
    });

    const signature = crypto
      .createHmac('sha256', userBinanceBound.secret)
      .update(signatureStr)
      .digest('hex');

    signatureStr += `&signature=${signature}`;

    const resultRequestCancelOrder = await cancelOrder({
      signature,
      signatureStr,
      apikey: userBinanceBound.apikey,
    });

    if (!resultRequestCancelOrder || !resultRequestCancelOrder.status) {
      return {
        status: false,
        message: resultRequestCancelOrder.message || 'Cant cancelOrder (stoploss order)',
      };
    }
  }

  const timestamp = new Date().getTime();
  let signatureStr = `timestamp=${timestamp}`;

  const obj = {
    symbol: instrumentName.replace('PERP', ''),
    side: userTradeBound.is_long ? 'SELL' : 'BUY',
    type: 'STOP_MARKET',
    timeInForce: 'GTC',
    stopPrice: userTradeBound.stoploss_price,
    quantity: userTradeBound.quantity,
  };

  Object.keys(obj).forEach(key => {
    signatureStr += `&${key}=${obj[key]}`;
  });

  const signature = crypto
    .createHmac('sha256', userBinanceBound.secret)
    .update(signatureStr)
    .digest('hex');

  signatureStr += `&signature=${signature}`;

  const resultRequestNewOrder = await newOrder({
    signature,
    signatureStr,
    apikey: userBinanceBound.apikey,
  });

  if (!resultRequestNewOrder || !resultRequestNewOrder.status) {
    return {
      status: false,
      message: resultRequestNewOrder.message || 'Cant newOrder (stoploss order)',
    };
  }

  const resultNewOrder = resultRequestNewOrder.result;

  if (!resultNewOrder) {
    return {
      status: false,
      message: 'No resultNewOrder (stoploss order)',
    };
  }

  userTradeBound.binance_stoploss_trade_id = resultNewOrder.orderId;

  await userTradeBound.save();

  return {
    status: true,
  };
};

module.exports = {
  createStopLossOrder,
};
