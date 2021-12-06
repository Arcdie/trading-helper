const axios = require('axios');

const log = require('../../../../libs/logger')(module);

const getFuturesInstruments = async () => {
  try {
    const resultRequest = await axios({
      method: 'GET',
      url: 'https://fapi.binance.com/fapi/v1/ticker/price',
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
  getFuturesInstruments,
};
