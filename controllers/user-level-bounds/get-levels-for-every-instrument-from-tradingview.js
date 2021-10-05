const {
  sendData,
} = require('../../services/websocket-server');

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

const Instrument = require('../../models/Instrument');
const UserLevelBound = require('../../models/UserLevelBound');

module.exports = async (req, res, next) => {
  const {
    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  const instrumentsDocs = await Instrument.find({
    is_active: true,
  }, {
    price: 1,
    name_futures: 1,
  }).exec();

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

  const successfulInstruments = [];
  const unsuccessfulInstruments = [];

  const tradingViewJwtToken = resultGetJwtToken.result.token;

  await (async () => {
    const lInstruments = instrumentsDocs.length;

    for (let i = 0; i < lInstruments; i += 1) {
      const instrumentDoc = instrumentsDocs[i];

      const resultGetLevels = await getTradingViewLevelsForInstrument({
        instrumentName: instrumentDoc.name_futures,
        tradingViewJwtToken,
        tradingViewChartId: user.tradingview_chart_id,
        tradingViewSessionId: user.tradingview_session_id,
      });

      if (!resultGetLevels || !resultGetLevels.status) {
        log.warn(resultGetLevels.message || 'Cant getTradingViewLevelsForInstrument');
        unsuccessfulInstruments.push(instrumentDoc._id.toString());
        return null;
      }

      const prices = [];

      if (!resultGetLevels.result
        || !resultGetLevels.result.payload
        || !resultGetLevels.result.payload.sources) {
        continue;
      }

      const {
        payload: {
          sources,
        },
      } = resultGetLevels.result;

      Object.keys(sources).forEach(key => {
        const {
          type,
          points,
        } = sources[key].state;

        if (LINE_TYPES.includes(type)) {
          points.forEach(point => prices.push(point.price));
        }
      });

      const userLevelBounds = await UserLevelBound.find({
        user_id: user._id,
        instrument_id: instrumentDoc._id,

        is_worked: false,
      }, {
        price_original: 1,
      }).exec();

      let countLevels = 0;

      // remove refused levels
      await Promise.all(userLevelBounds.map(async userLevelBound => {
        const doesExistLevelInTradingView = prices.some(
          price => parseFloat(price) === userLevelBound.price_original,
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
      await Promise.all(prices.map(async price => {
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

            priceOriginal: parseFloat(price),
          });

          if (!resultCreateBound || !resultCreateBound.status) {
            log.warn(resultCreateBound.message || 'Cant createUserLevelBound');
            return null;
          }

          countLevels += 1;
        }
      }));

      sendData({
        actionName: 'newLoadedLevels',
        instrumentName: instrumentDoc.name_futures,
        countLevels,
      });

      await sleep(300);
      console.log(`Ended ${instrumentDoc.name_futures}`);
    }

    sendData({
      actionName: 'endOfLoadLevels',
    });
  })();

  return res.json({
    status: true,
  });
};

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
