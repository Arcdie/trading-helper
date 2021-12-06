const axios = require('axios');

const log = require('../../../../libs/logger')(module);

const getSpotCandles = async ({
  symbol,
  interval,
  limit,

  startTime,
  endTime,
}) => {
  try {
    let queryParams = `symbol=${symbol}&interval=${interval}&limit=${limit}`;

    if (startTime) {
      queryParams += `&startTime=${startTime}`;
    }

    if (endTime) {
      queryParams += `&endTime=${endTime}`;
    }

    const resultRequest = await axios({
      method: 'GET',
      url: `https://api.binance.com/api/v3/klines?${queryParams}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return {
      status: true,
      result: resultRequest.data,
    };
  } catch (error) {
    log.error(error.message);

    return {
      status: false,
      message: error.response.data,
    };
  }
};

module.exports = {
  getSpotCandles,
};
