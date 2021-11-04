const moment = require('moment');

const {
  LIFETIME_1M_CANDLES,
  LIFETIME_5M_CANDLES,
} = require('../constants');

const Candle1m = require('../../../models/Candle-1m');
const Candle5m = require('../../../models/Candle-5m');

module.exports = async (req, res, next) => {
  const nowDateUnix = moment().unix();

  const remove1mCandlesDate = moment.unix(nowDateUnix - LIFETIME_1M_CANDLES);
  const remove5mCandlesDate = moment.unix(nowDateUnix - LIFETIME_5M_CANDLES);

  await Candle1m.deleteMany({
    time: { $lt: remove1mCandlesDate },
  }).exec();

  await Candle5m.deleteMany({
    time: { $lt: remove5mCandlesDate },
  }).exec();

  return res.json({
    status: true,
  });
};
