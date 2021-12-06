const {
  isMongoId,
} = require('validator');

const {
  isBoolean,
  isUndefined,
} = require('lodash');

const redis = require('../../libs/redis');
const log = require('../../libs/logger')(module);

const {
  MIN_AMOUNT_CANDLES_FOR_CALCULATE_LEVELS,
} = require('../user-level-bounds/constants');

const User = require('../../models/User');

module.exports = async (req, res, next) => {
  try {
    const {
      params: {
        userid,
      },

      user,
    } = req;

    let {
      body: {
        tradingviewUserId,
        tradingviewChartId,
        tradingviewSessionId,
        // tradingviewTargetListId,

        indentInPercents,

        isDrawLevelsFor1hCandles,
        isDrawLevelsFor4hCandles,
        isDrawLevelsForDayCandles,
        numberCandlesForCalculate1hLevels,
        numberCandlesForCalculate4hLevels,
        numberCandlesForCalculateDayLevels,

        doSpotSortByLifetime,
        doFuturesSortByLifetime,
        doSpotSortByDistanceToPrice,
        doFuturesSortByDistanceToPrice,
      },
    } = req;

    if (!user) {
      return res.json({
        status: false,
        message: 'Not authorized',
      });
    }

    if (!userid || !isMongoId(userid)) {
      return res.json({
        status: false,
        message: 'No or invalid userid',
      });
    }

    if (user._id.toString() !== userid.toString()) {
      return res.json({
        status: false,
        message: 'Access denied',
      });
    }

    if (tradingviewUserId && !Number.isInteger(parseInt(tradingviewUserId, 10))) {
      return res.json({
        status: false,
        message: 'Invalid tradingviewUserId',
      });
    }

    if (indentInPercents && Number.isNaN(parseFloat(indentInPercents))) {
      return res.json({
        status: false,
        message: 'Invalid indentInPercents',
      });
    }

    /*
    if (tradingviewTargetListId && !Number.isInteger(parseInt(tradingviewTargetListId, 10))) {
      return res.json({
        status: false,
        message: 'Invalid tradingviewTargetListId',
      });
    }
    */

    const userDoc = await User.findById(userid, {
      tradingview_user_id: 1,
      tradingview_chart_id: 1,
      tradingview_session_id: 1,
      // tradingview_list_id: 1,

      settings: 1,
      levels_monitoring_settings: 1,
    }).exec();

    if (!userDoc) {
      return res.json({
        status: false,
        message: 'No User',
      });
    }

    if (!userDoc.settings) {
      userDoc.settings = {};
    }

    if (!userDoc.levels_monitoring_settings) {
      userDoc.levels_monitoring_settings = {};
    }

    if (!userDoc.volume_monitoring_settings) {
      userDoc.volume_monitoring_settings = {};
    }

    if (tradingviewUserId) {
      tradingviewUserId = parseInt(tradingviewUserId, 10);
      userDoc.tradingview_user_id = tradingviewUserId;
    }

    /*
    if (tradingviewTargetListId) {
      tradingviewTargetListId = parseInt(tradingviewTargetListId, 10);
      userDoc.tradingview_list_id = tradingviewTargetListId;
    }
    */

    if (tradingviewChartId) {
      tradingviewChartId = tradingviewChartId
        .replace(/\\|\//g, '')
        .trim();

      userDoc.tradingview_chart_id = tradingviewChartId;
    }

    if (tradingviewSessionId) {
      tradingviewSessionId = tradingviewSessionId.trim();
      userDoc.tradingview_session_id = tradingviewSessionId;
    }

    if (indentInPercents || indentInPercents === 0) {
      userDoc.settings.indent_in_percents = parseFloat(indentInPercents);
    }

    if (!isUndefined(isDrawLevelsFor1hCandles) && isBoolean(isDrawLevelsFor1hCandles)) {
      userDoc.levels_monitoring_settings.is_draw_levels_for_1h_candles = isDrawLevelsFor1hCandles;
    }

    if (!isUndefined(isDrawLevelsFor4hCandles) && isBoolean(isDrawLevelsFor4hCandles)) {
      userDoc.levels_monitoring_settings.is_draw_levels_for_4h_candles = isDrawLevelsFor4hCandles;
    }

    if (!isUndefined(isDrawLevelsForDayCandles) && isBoolean(isDrawLevelsForDayCandles)) {
      userDoc.levels_monitoring_settings.is_draw_levels_for_day_candles = isDrawLevelsForDayCandles;
    }

    if (numberCandlesForCalculate1hLevels) {
      numberCandlesForCalculate1hLevels = parseInt(numberCandlesForCalculate1hLevels, 10);

      if (Number.isNaN(numberCandlesForCalculate1hLevels)
      || numberCandlesForCalculate1hLevels < MIN_AMOUNT_CANDLES_FOR_CALCULATE_LEVELS) {
        numberCandlesForCalculate1hLevels = MIN_AMOUNT_CANDLES_FOR_CALCULATE_LEVELS;
      }

      userDoc.levels_monitoring_settings.number_candles_for_calculate_1h_levels = numberCandlesForCalculate1hLevels;
    }

    if (numberCandlesForCalculate4hLevels) {
      numberCandlesForCalculate4hLevels = parseInt(numberCandlesForCalculate4hLevels, 10);

      if (Number.isNaN(numberCandlesForCalculate4hLevels)
      || numberCandlesForCalculate4hLevels < MIN_AMOUNT_CANDLES_FOR_CALCULATE_LEVELS) {
        numberCandlesForCalculate4hLevels = MIN_AMOUNT_CANDLES_FOR_CALCULATE_LEVELS;
      }

      userDoc.levels_monitoring_settings.number_candles_for_calculate_4h_levels = numberCandlesForCalculate4hLevels;
    }

    if (numberCandlesForCalculateDayLevels) {
      numberCandlesForCalculateDayLevels = parseInt(numberCandlesForCalculateDayLevels, 10);

      if (Number.isNaN(numberCandlesForCalculateDayLevels)
      || numberCandlesForCalculateDayLevels < MIN_AMOUNT_CANDLES_FOR_CALCULATE_LEVELS) {
        numberCandlesForCalculateDayLevels = MIN_AMOUNT_CANDLES_FOR_CALCULATE_LEVELS;
      }

      userDoc.levels_monitoring_settings.number_candles_for_calculate_1d_levels = numberCandlesForCalculateDayLevels;
    }

    // volume monitoring
    if (!isUndefined(doSpotSortByLifetime) && isBoolean(doSpotSortByLifetime)) {
      userDoc.volume_monitoring_settings.do_spot_sort_by_lifetime = doSpotSortByLifetime;
    }

    if (!isUndefined(doFuturesSortByLifetime) && isBoolean(doFuturesSortByLifetime)) {
      userDoc.volume_monitoring_settings.do_futures_sort_by_lifetime = doFuturesSortByLifetime;
    }

    if (!isUndefined(doSpotSortByDistanceToPrice) && isBoolean(doSpotSortByDistanceToPrice)) {
      userDoc.volume_monitoring_settings.do_spot_sort_by_distace_to_price = doSpotSortByDistanceToPrice;
    }

    if (!isUndefined(doFuturesSortByDistanceToPrice) && isBoolean(doFuturesSortByDistanceToPrice)) {
      userDoc.volume_monitoring_settings.do_futures_sort_by_distace_to_price = doFuturesSortByDistanceToPrice;
    }

    await userDoc.save();

    delete userDoc._doc.password;

    redis.delAsync(`USER:${userDoc._id.toString()}`);

    return res.json({
      status: true,
      result: userDoc._doc,
    });
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
