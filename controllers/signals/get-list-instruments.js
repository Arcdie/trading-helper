const axios = require('axios');

const {
  isMongoId,
} = require('validator');

const User = require('../../models/User');

module.exports = async (req, res, next) => {
  const {
    query: {
      userId,
      quoteId,
    },
  } = req;

  if (!quoteId) {
    return res.json({
      success: false,
      text: 'No quoteId',
    });
  }

  if (!userId || !isMongoId(userId)) {
    return res.json({
      success: false,
      text: 'No or invalid userId',
    });
  }

  const userDoc = await User.findById(userId, {
    tradingview_session_id: 1,
  }).exec();

  if (!userDoc) {
    return res.json({
      status: false,
      text: 'No User',
    });
  }

  const responseGetListInstruments = await axios({
    method: 'get',
    url: `https://ru.tradingview.com/api/v1/symbols_list/custom/${quoteId}`,
    headers: {
      'content-type': 'application/json',
      Cookie: `sessionid=${userDoc.tradingview_session_id};`,
    },
  });

  return res.json({
    status: true,
    result: responseGetListInstruments.data.symbols,
  });
};
