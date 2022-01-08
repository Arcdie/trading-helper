const moment = require('moment');

const {
  isUndefined,
} = require('lodash');

const {
  isMongoId,
} = require('validator');

const {
  randStr,
  generateMongoId,
} = require('../../../libs/support');

const log = require('../../../libs/logger')(module);

const {
  TYPES_EXIT,
  TYPES_TRADES,
} = require('../constants');

const UserTradeBoundStatistics = require('../../../models/UserTradeBoundStatistics');

const createUserTradeBoundForStatistics = async ({
  stopLossPercent,
  takeProfitPercent,

  buyPrice,
  sellPrice,

  tradeStartedAt,
  tradeEndedAt,

  takeProfitPrice,
  stopLossPrice,

  profitStepSize,

  typeTrade,
  typeExit,

  isLong,
  quantity,
  instrumentId,
}) => {
  try {
    if (!instrumentId || !isMongoId(instrumentId.toString())) {
      return {
        status: false,
        message: 'No or invalid instrumentId',
      };
    }

    if (isUndefined(isLong)) {
      return {
        status: false,
        message: 'No isLong',
      };
    }

    if (!typeTrade || !TYPES_TRADES.get(typeTrade)) {
      return {
        status: false,
        message: 'No or invalid typeTrade',
      };
    }

    if (!typeExit || !TYPES_EXIT.get(typeExit)) {
      return {
        status: false,
        message: 'No or invalid typeExit',
      };
    }

    const doesExistBound = await UserTradeBoundStatistics.findOne({
      is_long: isLong,
      instrument_id: instrumentId,
      trade_started_at: moment.unix(tradeStartedAt),
    }).exec();

    if (doesExistBound) {
      return {
        status: true,
        result: doesExistBound._doc,
      };
    }

    const newUserTradeBound = new UserTradeBoundStatistics({
      user_id: '6176a452ef4c0005812a9729',

      is_long: isLong,
      instrument_id: instrumentId,

      quantity,
      type_trade: typeTrade,
      type_exit: typeExit,

      user_binance_bound_id: generateMongoId(),
      strategy_target_id: generateMongoId(),
      my_binance_trade_id: randStr(8),

      stoploss_percent: stopLossPercent,
      takeprofit_percent: takeProfitPercent,

      buy_price: buyPrice,
      sell_price: sellPrice,

      trade_started_at: moment.unix(tradeStartedAt),
      trade_ended_at: moment.unix(tradeEndedAt),

      takeprofit_price: takeProfitPrice,
      stoploss_price: stopLossPrice,

      profit_step_size: profitStepSize,

      is_active: false,
    });

    await newUserTradeBound.save();

    return {
      status: true,
      result: newUserTradeBound._doc,
    };
  } catch (error) {
    log.error(error.message);

    return {
      status: true,
      message: error.message,
    };
  }
};

module.exports = {
  createUserTradeBoundForStatistics,
};
