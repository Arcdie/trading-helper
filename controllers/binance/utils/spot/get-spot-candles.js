const axios = require('axios');

const getSpotCandles = async ({
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
    url: `https://api.binance.com/api/v3/klines?${queryParams}`,
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
  getSpotCandles,
};
