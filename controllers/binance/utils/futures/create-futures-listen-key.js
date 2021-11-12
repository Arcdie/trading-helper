const axios = require('axios');

const createFuturesListenKey = async ({
  apikey,
}) => {
  try {
    const responseNewListenKey = await axios({
      method: 'post',
      url: 'https://fapi.binance.com/fapi/v1/listenKey',

      headers: {
        'X-MBX-APIKEY': apikey,
        'Content-Type': 'application/json',
      },
    });

    return {
      status: true,
      result: responseNewListenKey.data,
    };
  } catch (error) {
    return {
      status: false,
      message: error.response.data,
    };
  }
};

module.exports = {
  createFuturesListenKey,
};
