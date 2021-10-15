const axios = require('axios');

const setLeverage = async ({
  symbol,
  signature,
  timestamp,
  leverage,
  apikey,
}) => {
  const responseGetInfo = await axios({
    method: 'post',
    url: `https://fapi.binance.com/fapi/v1/leverage?symbol=${symbol}&leverage=${leverage}&timestamp=${timestamp}&signature=${signature}`,

    headers: {
      'X-MBX-APIKEY': apikey,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: true,
    result: responseGetInfo.data,
  };
};

module.exports = {
  setLeverage,
};
