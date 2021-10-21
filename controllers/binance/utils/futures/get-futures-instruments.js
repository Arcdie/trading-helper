const axios = require('axios');

const getFuturesInstruments = async () => {
  const responseGetInstruments = await axios({
    method: 'get',
    url: 'https://fapi.binance.com/fapi/v1/ticker/price',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return {
    status: true,
    result: responseGetInstruments.data,
  };
};

module.exports = {
  getFuturesInstruments,
};
