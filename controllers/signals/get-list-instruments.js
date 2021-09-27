const axios = require('axios');

module.exports = async (req, res, next) => {
  const {
    query: {
      quoteId,
      sessionId,
    },
  } = req;

  if (!quoteId) {
    return res.json({
      success: false,
      text: 'No quoteId',
    });
  }

  if (!sessionId) {
    return res.json({
      success: false,
      text: 'No sessionId',
    });
  }

  const responseGetListInstruments = await axios({
    method: 'get',
    url: `https://ru.tradingview.com/api/v1/symbols_list/active/${quoteId}`,
    headers: {
      'content-type': 'application/json',
      Cookie: `sessionid=${sessionId};`,
    },
  });

  return res.json({
    status: true,
    data: responseGetListInstruments.data,
  });
};
