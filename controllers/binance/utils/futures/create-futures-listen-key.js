const axios = require('axios');

const log = require('../../../../libs/logger')(module);

const createFuturesListenKey = async ({
  apikey,
}) => {
  try {
    const resultRequest = await axios({
      method: 'POST',
      url: 'https://fapi.binance.com/fapi/v1/listenKey',

      headers: {
        'X-MBX-APIKEY': apikey,
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
  createFuturesListenKey,
};
