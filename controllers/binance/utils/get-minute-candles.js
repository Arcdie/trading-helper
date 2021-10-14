const axios = require('axios');

const getMinuteCandles = async ({
  symbol,
  startTime,
  endTime,
  limit,
}) => {
  const responseGetInfo = await axios({
    method: 'get',
    url: `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1m&startTime=${startTime}&endTime=${endTime}&limit=${limit}`,
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
  getMinuteCandles,
};
