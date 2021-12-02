const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const {
  TYPES_TRADES,
} = require('./constants');

const UserTradeBound = require('../../models/UserTradeBound');

module.exports = async (req, res, next) => {
  const {
    query: {
      typeTrade,
      instrumentId,
    },

    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  if (!instrumentId || !isMongoId(instrumentId)) {
    return res.json({
      status: false,
      message: 'No or invalid instrumentId',
    });
  }

  if (!typeTrade || !TYPES_TRADES.get(typeTrade)) {
    return res.json({
      status: false,
      message: 'No or invalid typeTrade',
    });
  }

  let {
    startDate,
    endDate,
  } = req.query;

  if (!startDate || !moment(startDate).isValid()) {
    return res.json({
      status: false,
      message: 'No or invalid startDate',
    });
  }

  if (!endDate || !moment(endDate).isValid()) {
    return res.json({
      status: false,
      message: 'No or invalid endDate',
    });
  }

  startDate = moment(startDate).utc().startOf('minute');
  endDate = moment(endDate).utc().startOf('minute');

  const userTradeBounds = await UserTradeBound
    .find({
      instrument_id: instrumentId,
      type_trade: typeTrade,

      $and: [{
        trade_started_at: {
          $gt: startDate,
        },
      }, {
        trade_started_at: {
          $lt: endDate,
        },
      }],
    }, {
      is_long: 1,
      is_active: 1,
      buy_price: 1,
      sell_price: 1,
      type_exit: 1,
      quantity: 1,
      stoploss_percent: 1,
      takeprofit_percent: 1,

      trade_started_at: 1,
      trade_ended_at: 1,
    })
    .sort({ trade_started_at: 1 })
    .exec();

  return res.json({
    status: true,
    result: userTradeBounds.map(doc => doc._doc),
  });
};
