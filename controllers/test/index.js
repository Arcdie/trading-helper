const axios = require('axios');

const testController = async (req, res, next) => {
  const {
    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  const responseGetSite = await axios({
    method: 'get',
    url: 'https://ru.tradingview.com/chart/XCMsz22F/',
    headers: {
      'Content-type': 'text/html',
      Cookie: `sessionid=${user.tradingview_session_id};`,
    },
  });

  const html = responseGetSite.data;

  res.json({
    status: true,
    result: html,
  });
};

const getStatic = async (req, res, next) => {
  const responseGetResource = await axios({
    method: 'get',
    url: `https://ru.tradingview.com/${req.originalUrl}`,
  });

  res.send(responseGetResource.data);
};

module.exports = {
  testController,
  getStatic,
};
