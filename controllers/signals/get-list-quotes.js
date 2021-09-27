const axios = require('axios');

module.exports = async (req, res, next) => {
  const {
    query: {
      sessionId,
    },
  } = req;

  if (!sessionId) {
    return res.json({
      success: false,
      text: 'No sessionId',
    });
  }

  const responseGetQuotes = await axios({
    method: 'get',
    url: 'https://ru.tradingview.com/api/v1/symbols_list/custom',
    headers: {
      'content-type': 'application/json',
      Cookie: `sessionid=${sessionId};`,
    },
  });

  return res.json({
    status: true,
    data: responseGetQuotes.data,
  });
};
