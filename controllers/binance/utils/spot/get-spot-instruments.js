const axios = require('axios');

const getSpotInstruments = async () => {
  const responseGetInstruments = await axios({
    method: 'get',
    url: 'https://api.binance.com/api/v3/ticker/price',
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
  getSpotInstruments,
};
