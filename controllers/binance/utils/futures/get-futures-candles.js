const axios = require('axios');

const getFuturesCandles = async ({
  symbol,
  interval,
  limit,

  startTime,
  endTime,
}) => {
  let queryParams = `symbol=${symbol}&interval=${interval}&limit=${limit}`;

  if (startTime) {
    queryParams += `&startTime=${startTime}`;
  }

  if (endTime) {
    queryParams += `&endTime=${endTime}`;
  }

  const responseGetInfo = await axios({
    method: 'get',
    url: `https://fapi.binance.com/fapi/v1/klines?${queryParams}`,
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
  getFuturesCandles,
};
