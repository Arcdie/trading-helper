const axios = require('axios');

const getTradingViewLevelsForInstrument = async ({
  instrumentName,
  tradingViewChartId,
  tradingViewJwtToken,
  tradingViewSessionId,
}) => {
  const responseGetLevels = await axios({
    method: 'get',
    url: `https://charts-storage.tradingview.com/charts-storage/layout/${tradingViewChartId}/sources?chart_id=1&jwt=${tradingViewJwtToken}&symbol=BINANCE:${instrumentName}`,
    headers: {
      'Content-Type': 'application/json',
      Cookie: `sessionid=${tradingViewSessionId};`,
    },
  });

  return {
    status: true,
    result: responseGetLevels.data,
  };
};

module.exports = {
  getTradingViewLevelsForInstrument,
};
