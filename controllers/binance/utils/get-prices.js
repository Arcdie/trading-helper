const axios = require('axios');

const getPrices = async () => {
  const responseGetPrices = await axios({
    method: 'get',
    url: 'https://fapi.binance.com/fapi/v1/ticker/price',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return {
    status: true,
    result: responseGetPrices.data,
  };
};

module.exports = {
  getPrices,
};
