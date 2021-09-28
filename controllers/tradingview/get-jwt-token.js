const axios = require('axios');

const {
  isMongoId,
} = require('validator');

const User = require('../../models/User');

module.exports = async (req, res, next) => {
  const {
    query: {
      userId,
    },
  } = req;

  if (!userId || !isMongoId(userId)) {
    return res.json({
      status: false,
      text: 'No or invalid userId',
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

  const responseGetToken = await axios({
    method: 'get',
    url: `https://ru.tradingview.com/chart-token/?image_url=${userDoc.tradingview_chart_id}&user_id=${userDoc.tradingview_user_id}`,
    headers: {
      'Content-Type': 'application/json',
      Cookie: `sessionid=${userDoc.tradingview_session_id};`,
    },
  });

  return res.json({
    status: true,
    result: responseGetToken.data,
  });
};
