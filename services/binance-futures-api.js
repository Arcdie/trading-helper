const axios = require('axios');

const log = require('../libs/logger');

const Instrument = require('../models/Instrument');

module.exports = async () => {
  const instrumentsDocs = await Instrument.find({}, {
    name: 1,
  }).exec();

  setInterval(async () => {
    const responseGetPrices = await axios({
      method: 'get',
      url: 'https://fapi.binance.com/fapi/v1/ticker/price',
    });
  }, 1000 * 60 * 10); // 10 minutes
};
