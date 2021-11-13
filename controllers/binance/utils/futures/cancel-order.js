const axios = require('axios');

const cancelOrder = async ({
  apikey,
  signature,
  signatureStr,
}) => {
  try {
    const responseNewOrder = await axios({
      method: 'delete',
      url: `https://fapi.binance.com/fapi/v1/order?${signatureStr}`,

      headers: {
        'X-MBX-APIKEY': apikey,
        'Content-Type': 'application/json',
      },
    });

    return {
      status: true,
      result: responseNewOrder.data,
    };
  } catch (error) {
    return {
      status: false,
      message: error.response.data,
    };
  }
};

module.exports = {
  cancelOrder,
};
