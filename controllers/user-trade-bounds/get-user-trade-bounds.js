const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const log = require('../../libs/logger')(module);

const {
  TYPES_TRADES,
} = require('./constants');

const UserTradeBound = require('../../models/UserTradeBound');
const UserTradeBoundTest = require('../../models/UserTradeBoundTest');

module.exports = async (req, res, next) => {
  try {
    const {
      query: {
        typeTrade,
        instrumentId,

        startDate,
        endDate,

        isTest,
      },

      user,
    } = req;

    if (!user) {
      return res.json({
        status: false,
        message: 'Not authorized',
      });
    }

    if (!typeTrade || !TYPES_TRADES.get(typeTrade)) {
      return res.json({
        status: false,
        message: 'No or invalid typeTrade',
      });
    }

    if (instrumentId && !isMongoId(instrumentId)) {
      return res.json({
        status: false,
        message: 'Invalid instrumentId',
      });
    }

    if (startDate && !moment(startDate).isValid()) {
      return res.json({
        status: false,
        message: 'Invalid startDate',
      });
    }

    if (endDate && !moment(endDate).isValid()) {
      return res.json({
        status: false,
        message: 'Invalid endDate',
      });
    }

    const TargetBoundModel = isTest && isTest === 'true' ? UserTradeBoundTest : UserTradeBound;

    const matchObj = {
      user_id: user._id,
      type_trade: typeTrade,
    };

    if (instrumentId) {
      matchObj.instrument_id = instrumentId;
    }

    if (startDate && endDate) {
      const momentStartTime = moment(startDate).utc().startOf('minute');
      const momentEndTime = moment(endDate).utc().startOf('minute');

      matchObj.$and = [{
        trade_started_at: {
          $gt: momentStartTime,
        },
      }, {
        trade_started_at: {
          $lt: momentEndTime,
        },
      }];
    } else if (startDate) {
      const momentStartTime = moment(startDate).utc().startOf('minute');

      matchObj.trade_started_at = {
        $gt: momentStartTime,
      };
    } else if (endDate) {
      const momentEndTime = moment(endDate).utc().startOf('minute');

      matchObj.trade_started_at = {
        $lt: momentEndTime,
      };
    }

    const userTradeBounds = await TargetBoundModel
      .find(matchObj)
      .sort({ trade_started_at: 1 })
      .exec();

    return res.json({
      status: true,
      result: userTradeBounds.map(doc => doc._doc),
    });
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
