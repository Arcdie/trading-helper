const axios = require('axios');

const getLeverageBracketsData = async ({
  signature,
  timestamp,
  apikey,
}) => {
  const responseGetInfo = await axios({
    method: 'get',
    url: `https://fapi.binance.com/fapi/v1/leverageBracket?timestamp=${timestamp}&signature=${signature}`,
    headers: {
      'X-MBX-APIKEY': apikey,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: true,
    result: responseGetInfo.data,
  };
};

module.exports = {
  getLeverageBracketsData,
};
