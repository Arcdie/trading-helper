const axios = require('axios');

module.exports = async (req, res, next) => {
  const {
    user,
  } = req;

  const responseGetLists = await axios({
    method: 'get',
    url: 'https://ru.tradingview.com/api/v1/symbols_list/custom',
    headers: {
      'content-type': 'application/json',
      Cookie: `sessionid=${user.tradingview_session_id};`,
    },
  });

  return res.json({
    status: true,
    result: responseGetLists.data,
  });
};
