const {
  isMongoId,
} = require('validator');

const {
  isBoolean,
  isUndefined,
} = require('lodash');

const redis = require('../../libs/redis');

const User = require('../../models/User');

module.exports = async (req, res, next) => {
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
    userDoc.levels_monitoring_settings.number_candles_for_calculate_1h_levels = parseInt(numberCandlesForCalculate1hLevels, 10);
  }

  if (numberCandlesForCalculate4hLevels) {
    userDoc.levels_monitoring_settings.number_candles_for_calculate_4h_levels = parseInt(numberCandlesForCalculate4hLevels, 10);
  }

  if (numberCandlesForCalculateDayLevels) {
    userDoc.levels_monitoring_settings.number_candles_for_calculate_day_levels = parseInt(numberCandlesForCalculateDayLevels, 10);
  }

  await userDoc.save();

  delete userDoc._doc.password;

  redis.delAsync(`USER:${userDoc._id.toString()}`);

  return res.json({
    status: true,
    result: userDoc._doc,
  });
};
