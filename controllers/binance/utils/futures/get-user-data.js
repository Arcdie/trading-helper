const axios = require('axios');

const log = require('../../../../libs/logger')(module);

const getUserData = async ({
  signature,
  timestamp,
  apikey,
}) => {
  try {
    const resultRequest = await axios({
      method: 'GET',
      url: `https://fapi.binance.com/fapi/v2/account?timestamp=${timestamp}&signature=${signature}`,
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
  getUserData,
};
