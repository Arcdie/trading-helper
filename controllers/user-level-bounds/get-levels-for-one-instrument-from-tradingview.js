const {
  isMongoId,
} = require('validator');

const {
  sendData,
} = require('../../websocket/websocket-server');

const {
  createUserLevelBound,
} = require('./utils/create-user-level-bound');

const {
  getTradingViewJwtToken,
} = require('../tradingview/utils/get-tradingview-jwt-token');

const {
  getTradingViewLevelsForInstrument,
} = require('../tradingview/utils/get-tradingview-levels-for-instrument');

const log = require('../../libs/logger');

const {
  LINE_TYPES,
} = require('../tradingview/constants');

const InstrumentNew = require('../../models/InstrumentNew');
const UserLevelBound = require('../../models/UserLevelBound');

module.exports = async (req, res, next) => {
  const {
    body: {
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

  const instrumentDoc = await InstrumentNew.findById(instrumentId, {
    name: 1,
    price: 1,
    is_active: 1,
  }).exec();

  if (!instrumentDoc) {
    return res.json({
      status: false,
      message: 'No Instrument',
    });
  }

  if (!instrumentDoc.is_active) {
    return res.json({
      status: false,
      message: 'Instrument is not active',
    });
  }

  const resultGetJwtToken = await getTradingViewJwtToken({
    tradingViewUserId: user.tradingview_user_id,
    tradingViewChartId: user.tradingview_chart_id,
    tradingViewSessionId: user.tradingview_session_id,
  });

  if (!resultGetJwtToken || !resultGetJwtToken.status) {
    return res.json({
      status: false,
      message: resultGetJwtToken.message || 'Cant getTradingViewJwtToken',
    });
  }

  const tradingViewJwtToken = resultGetJwtToken.result.token;

  const resultGetLevels = await getTradingViewLevelsForInstrument({
    instrumentName: instrumentDoc.name,
    tradingViewJwtToken,
    tradingViewChartId: user.tradingview_chart_id,
    tradingViewSessionId: user.tradingview_session_id,
  });

  if (!resultGetLevels || !resultGetLevels.status) {
    const message = resultGetLevels.message || 'Cant getTradingViewLevelsForInstrument';

    log.warn(message);

    return res.json({
      status: false,
      message,
    });
  }

  const userLevelBounds = await UserLevelBound.find({
    user_id: user._id,
    instrument_id: instrumentDoc._id,

    is_worked: false,
  }, {
    price_original: 1,
  }).exec();

  const prices = [];
  let countLevels = 0;

  if (resultGetLevels.result
    && resultGetLevels.result.payload
    && resultGetLevels.result.payload.sources) {
    const {
      payload: {
        sources,
      },
    } = resultGetLevels.result;

    Object.keys(sources).forEach(key => {
      const {
        type,
        points,

        state: {
          linecolor,
        },
      } = sources[key].state;

      if (LINE_TYPES.includes(type)) {
        const timeframe = linecolor === 'rgba(33, 150, 243, 1)' ?
          '4h' : '5m';

        points.forEach(point => prices.push({
          price: point.price,
          timeframe,
        }));
      }
    });
  }

  // remove refused levels
  await Promise.all(userLevelBounds.map(async userLevelBound => {
    const doesExistLevelInTradingView = prices.some(
      ({ price }) => parseFloat(price) === userLevelBound.price_original,
    );

    if (!doesExistLevelInTradingView) {
      await UserLevelBound.findByIdAndUpdate(userLevelBound._id, {
        is_worked: true,
        worked_at: new Date(),
      }).exec();

      return null;
    }

    countLevels += 1;
  }));

  // add new levels
  await Promise.all(prices.map(async ({ price, timeframe }) => {
    const parsedPrice = parseFloat(price);

    const doesExistUserLevelBound = userLevelBounds.some(
      bound => bound.price_original === parsedPrice,
    );

    if (!doesExistUserLevelBound) {
      const resultCreateBound = await createUserLevelBound({
        userId: user._id,
        indentInPercents: (user.settings && user.settings.indent_in_percents) || false,

        instrumentId: instrumentDoc._id,
        instrumentPrice: instrumentDoc.price,

        timeframe,
        priceOriginal: parseFloat(price),
      });

      if (!resultCreateBound || !resultCreateBound.status) {
        log.warn(resultCreateBound.message || 'Cant createUserLevelBound');
        return null;
      }

      countLevels += 1;
    }
  }));

  return res.json({
    status: true,
    result: countLevels,
  });
};
