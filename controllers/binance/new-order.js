const crypto = require('crypto');

const {
  binanceConf,
} = require('../../config');

const {
  newOrder,
} = require('./utils/futures/new-order');

const InstrumentNew = require('../../models/InstrumentNew');

module.exports = async (req, res, next) => {
  const {
    body: {
      symbol,
      side,
      positionSide,
      type,
      quantity,
      price,
      stopPrice,
      recvWindow,
      timeInForce,
    },

    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  if (!symbol) {
    return res.json({
      status: false,
      message: 'No symbol',
    });
  }

  if (!side || !['BUY', 'SELL'].includes(side)) {
    return res.json({
      status: false,
      message: 'No or invalid side',
    });
  }

  if (!positionSide || !['LONG', 'SHORT'].includes(positionSide)) {
    return res.json({
      status: false,
      message: 'No or invalid positionSide',
    });
  }

  if (!type || !['LIMIT', 'MARKET', 'STOP', 'TAKE_PROFIT', 'STOP_MARKET', 'TAKE_PROFIT_MARKET'].includes(type)) {
    return res.json({
      status: false,
      message: 'No or invalid type',
    });
  }

  const doesExistInstrument = await InstrumentNew.exists({
    name: symbol,
    is_active: true,
    is_futures: true,
  });

  if (!doesExistInstrument) {
    return res.json({
      status: false,
      message: 'No Instrument',
    });
  }

  const timestamp = new Date().getTime();

  let signatureStr = `timestamp=${timestamp}`;

  const obj = {
    symbol, side, type,
  };

  if (price) {
    obj.price = price;
  }

  if (stopPrice) {
    obj.stopPrice = stopPrice;
  }

  if (recvWindow) {
    obj.recvWindow = recvWindow;
  }

  if (timeInForce) {
    obj.timeInForce = 'GTC';
  }

  if (quantity) {
    obj.quantity = quantity;
  }

  obj.symbol = symbol.replace('PERP', '');

  Object.keys(obj).forEach(key => {
    signatureStr += `&${key}=${obj[key]}`;
  });

  const signature = crypto
    .createHmac('sha256', binanceConf.secret)
    .update(signatureStr)
    .digest('hex');

  signatureStr += `&signature=${signature}`;

  const resultNewOrder = await newOrder({
    signature,
    signatureStr,
    apikey: binanceConf.apikey,
  });

  if (!resultNewOrder || !resultNewOrder.status) {
    return res.json({
      status: false,
      message: resultNewOrder.message || 'Cant newOrder',
    });
  }

  return res.json({
    status: true,
  });
};
