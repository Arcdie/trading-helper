const moment = require('moment');

const {
  isUndefined,
} = require('lodash');

const {
  isMongoId,
} = require('validator');

const log = require('../../../libs/logger')(module);

const {
  addFigureLinesToRedis,
} = require('./add-figure-lines-to-redis');

const {
  INTERVALS,
} = require('../../candles/constants');

const UserFigureLineBound = require('../../../models/UserFigureLineBound');

const createUserFigureLineBound = async ({
  userId,

  instrumentId,
  instrumentName,

  isLong,
  priceAngle,
  lineTimeframe,
  lineStartCandleTimeUnix,
  lineStartCandleExtremum,
}) => {
  try {
    if (!userId || !isMongoId(userId.toString())) {
      return {
        status: false,
        message: 'No or invalid userId',
      };
    }

    if (isUndefined(priceAngle)) {
      return {
        status: false,
        message: 'No or invalid priceAngle',
      };
    }

    if (!lineTimeframe || !INTERVALS.get(lineTimeframe)) {
      return {
        status: false,
        message: 'No or invalid lineTimeframe',
      };
    }

    if (!lineStartCandleExtremum) {
      return {
        status: false,
        message: 'No or invalid lineStartCandleExtremum',
      };
    }

    if (!lineStartCandleTimeUnix) {
      return {
        status: false,
        message: 'No or invalid lineStartCandleTimeUnix',
      };
    }

    if (isUndefined(isLong)) {
      return {
        status: false,
        message: 'No isLong',
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

    const lineStartCandleTime = moment.unix(lineStartCandleTimeUnix);

    const userLineBound = await UserFigureLineBound.findOne({
      user_id: userId,
      instrument_id: instrumentId,

      is_long: isLong,
      price_angle: priceAngle,
      line_start_candle_time: lineStartCandleTime,
    }).exec();

    if (userLineBound) {
      return {
        status: true,
        isCreated: false,
        result: userLineBound._doc,
      };
    }

    const newFigureLine = new UserFigureLineBound({
      user_id: userId,
      instrument_id: instrumentId,

      is_long: isLong,

      price_angle: priceAngle,
      line_timeframe: lineTimeframe,
      line_start_candle_time: lineStartCandleTime,
      line_start_candle_extremum: lineStartCandleExtremum,
    });

    await newFigureLine.save();

    /*
    await addFigureLinesToRedis({
      userId,
      instrumentName,

      figureLines: [{
        lineStartCandleTimeUnix,
        isLong: newFigureLine.is_long,
        priceAngle: newFigureLine.price_angle,
        boundId: newFigureLine._id.toString(),
      }],
    });
    */

    return {
      status: true,
      result: newFigureLine._doc,
    };
  } catch (error) {
    log.warn(error.message);

    return {
      status: false,
      message: error.message,
    };
  }
};

module.exports = {
  createUserFigureLineBound,
};
