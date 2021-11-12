const crypto = require('crypto');

const {
  isMongoId,
} = require('validator');

const {
  newOrder,
} = require('../../binance/utils/futures/new-order');

const {
  STOP_LOSS_PERCENT,
} = require('../constants');

const UserTradeBound = require('../../../models/UserTradeBound');
const UserBinanceBound = require('../../../models/UserBinanceBound');

const createUserTradeBound = async ({
  userId,
  instrumentId,
  instrumentName,
  stopLossPercent,

  side,
  type,
  quantity,
  price,
}) => {
  if (!userId || !isMongoId(userId.toString())) {
    return {
      status: false,
      message: 'No or invalid userId',
    };
  }

  if (!instrumentId || !isMongoId(instrumentId.toString())) {
    return {
      status: false,
      message: 'No or invalid instrumentId',
    };
  }

  if (!instrumentName) {
    return {
      status: false,
      message: 'No instrumentName',
    };
  }

  if (!side || !['BUY', 'SELL'].includes(side)) {
    return {
      status: false,
      message: 'No or invalid side',
    };
  }

  if (!type || !['LIMIT', 'MARKET'].includes(type)) {
    return {
      status: false,
      message: 'No or invalid type',
    };
  }

  if (!quantity) {
    return {
      status: false,
      message: 'No quantity',
    };
  }

  const isMarketOrder = type === 'MARKET';

  if (!isMarketOrder && !price) {
    return {
      status: false,
      message: 'No price',
    };
  }

  if (!stopLossPercent) {
    stopLossPercent = STOP_LOSS_PERCENT;
  }

  const userBinanceBound = await UserBinanceBound.findOne({
    user_id: userId,
    is_active: true,
  }).exec();

  if (!userBinanceBound) {
    return {
      status: false,
      message: 'No active UserBinanceBound',
    };
  }

  const timestamp = new Date().getTime();
  let signatureStr = `timestamp=${timestamp}`;

  const obj = {
    symbol: instrumentName.replace('PERP', ''),
    side,
    type,
    quantity,
  };

  if (!isMarketOrder) {
    obj.price = price;
    obj.timeInForce = 'GTC';
  }

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
      message: resultRequestNewOrder.message || 'Cant newOrder',
    };
  }

  const resultNewOrder = resultRequestNewOrder.result;

  if (!resultNewOrder) {
    return {
      status: false,
      message: 'No resultNewOrder',
    };
  }

  const newTradeBound = new UserTradeBound({
    user_id: userId,
    instrument_id: instrumentId,
    user_binance_bound_id: userBinanceBound._id,

    quantity,
    is_active: false,
    stoploss_percent: stopLossPercent,
    is_long: side === 'BUY',
    binance_trade_id: resultNewOrder.orderId,
  });

  await newTradeBound.save();

  return {
    status: true,
  };
};

module.exports = {
  createUserTradeBound,
};
