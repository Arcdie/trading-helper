const axios = require('axios');

const log = require('../../../../libs/logger')(module);

const getFuturesExchangeInfo = async () => {
  try {
    const resultRequest = await axios({
      method: 'GET',
      url: 'https://fapi.binance.com/fapi/v1/exchangeInfo',
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
  getFuturesExchangeInfo,
};
