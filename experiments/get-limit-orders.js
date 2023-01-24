const axios = require('axios');
const crypto = require('crypto');

const URL = 'https://api.binance.com/sapi/v1';
const API_KEY = '';
const SECRET_KEY = '';

const inputParams = {
  symbol: 'ADAUSDT',
  startTime: 1673308800 * 1000, // Tue, 10 Jan 2023 00:00:00 GMT
  endTime: 1673395200 * 1000, // Wed, 11 Jan 2023 00:00:00 GMT
  dataType: 'T_DEPTH',
};

module.exports = async () => {
  return;
  console.log('here');

  let queryStr;

  /*
  queryStr = getSignatureStr(inputParams);

  const resultRequest = await axios({
    method: 'POST',
    url: `${URL}/futuresHistDataId?${queryStr}`,

    headers: {
      'X-MBX-APIKEY': API_KEY,
      'Content-Type': 'application/json',
    },
  });
  */

  const downloadId = 745781;
  // const downloadId = resultRequest.data.id;
  // console.log('downloadId', downloadId);

  queryStr = getSignatureStr({
    downloadId,
  });

  const resultGetRequest = await axios({
    method: 'GET',
    url: `${URL}/downloadLink?${queryStr}`,

    headers: {
      'X-MBX-APIKEY': API_KEY,
      'Content-Type': 'application/json',
    },
  });

  // 745781
  console.log('resultGetRequest', resultGetRequest.data);
};

const getSignatureStr = (params = {}) => {
  const timestamp = new Date().getTime();
  let signatureStr = `timestamp=${timestamp}`;

  Object.keys(params).forEach(key => {
    signatureStr += `&${key}=${params[key]}`;
  });

  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(signatureStr)
    .digest('hex');

  signatureStr += `&signature=${signature}`;
  return signatureStr;
};
