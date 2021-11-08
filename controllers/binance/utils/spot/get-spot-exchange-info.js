const axios = require('axios');

const getSpotExchangeInfo = async () => {
  const responseGetInfo = await axios({
    method: 'get',
    url: 'https://api.binance.com/api/v3/exchangeInfo',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return {
    status: true,
    result: responseGetInfo.data,
  };
};

module.exports = {
  getSpotExchangeInfo,
};
