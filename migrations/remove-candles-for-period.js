const moment = require('moment');

const Candle5m = require('../models/Candle-5m');
const Candle1h = require('../models/Candle-1h');
const Candle4h = require('../models/Candle-4h');
const Candle1d = require('../models/Candle-1d');

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  const startDate = moment('2021-11-03 00:00:00.000Z').utc();
  const endDate = moment('2021-11-05 00:00:00.000Z').utc();

  const deleteMatch = {
    $and: [{
      time: { $gte: startDate },
    }, {
      time: { $lt: endDate },
    }],
  };

  await Candle5m.deleteMany(deleteMatch).exec();
  await Candle1h.deleteMany(deleteMatch).exec();
  await Candle4h.deleteMany(deleteMatch).exec();
  await Candle1d.deleteMany(deleteMatch).exec();

  console.timeEnd('migration');
};
