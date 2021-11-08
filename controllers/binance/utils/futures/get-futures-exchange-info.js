const axios = require('axios');

const getFuturesExchangeInfo = async () => {
  const responseGetInfo = await axios({
    method: 'get',
    url: 'https://fapi.binance.com/fapi/v1/exchangeInfo',
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
  getFuturesExchangeInfo,
};
