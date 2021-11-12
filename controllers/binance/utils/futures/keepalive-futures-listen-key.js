const axios = require('axios');

const keepaliveFuturesListenKey = async ({
  apikey,
}) => {
  try {
    const responseKeepaliveListenKey = await axios({
      method: 'put',
      url: 'https://fapi.binance.com/fapi/v1/listenKey',

      headers: {
        'X-MBX-APIKEY': apikey,
        'Content-Type': 'application/json',
      },
    });

    return {
      status: true,
      result: responseKeepaliveListenKey.data,
    };
  } catch (error) {
    return {
      status: false,
      message: error.response.data,
    };
  }
};

module.exports = {
  keepaliveFuturesListenKey,
};
