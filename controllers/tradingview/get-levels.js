const axios = require('axios');

const {
  isMongoId,
} = require('validator');

const User = require('../../models/User');
const InstrumentNew = require('../../models/InstrumentNew');

module.exports = async (req, res, next) => {
  const {
    query: {
      userId,
      instrumentId,
      jwtToken,
    },
  } = req;

  if (!userId || !isMongoId(userId)) {
    return res.json({
      status: false,
      text: 'No or invalid userId',
    });
  }

  if (!instrumentId || !isMongoId(instrumentId)) {
    return res.json({
      status: false,
      text: 'No or invalid instrumentId',
    });
  }

  if (!jwtToken) {
    return res.json({
      status: false,
      text: 'No jwtToken',
    });
  }

  const instrumentDoc = await InstrumentNew.findById(instrumentId, {
    name: 1,
  }).exec();

  if (!instrumentDoc) {
    return res.json({
      status: false,
      text: 'No Instrument',
    });
  }

  const userDoc = await User.findById(userId, {
    tradingview_user_id: 1,
    tradingview_chart_id: 1,
    tradingview_session_id: 1,
  }).exec();

  if (!userDoc) {
    return res.json({
      status: false,
      text: 'No User',
    });
  }

  const responseGetLevels = await axios({
    method: 'get',
    url: `https://charts-storage.tradingview.com/charts-storage/layout/${userDoc.tradingview_chart_id}/sources?chart_id=1&jwt=${jwtToken}&symbol=BINANCE:${instrumentDoc.name}`,
    headers: {
      'Content-Type': 'application/json',
      Cookie: `sessionid=${userDoc.tradingview_session_id};`,
    },
  });

  return res.json({
    status: true,
    result: responseGetLevels.data,
  });
};
