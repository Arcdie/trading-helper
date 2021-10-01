const axios = require('axios');

const getTradingViewJwtToken = async ({
  tradingViewUserId,
  tradingViewChartId,
  tradingViewSessionId,
}) => {
  const responseGetToken = await axios({
    method: 'get',
    url: `https://ru.tradingview.com/chart-token/?image_url=${tradingViewChartId}&user_id=${tradingViewUserId}`,
    headers: {
      'Content-Type': 'application/json',
      Cookie: `sessionid=${tradingViewSessionId};`,
    },
  });

  return {
    status: true,
    result: responseGetToken.data,
  };
};

module.exports = {
  getTradingViewJwtToken,
};
