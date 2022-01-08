const moment = require('moment');

const Candle1m = require('../models/Candle-1m');
const Candle5m = require('../models/Candle-5m');
const Candle1h = require('../models/Candle-1h');
const Candle4h = require('../models/Candle-4h');
const Candle1d = require('../models/Candle-1d');

const InstrumentNew = require('../models/InstrumentNew');

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  const instrumentsDocs = await InstrumentNew.find({
    // is_active: true,
    // is_futures: false,
  }, { _id: 1 }).exec();

  const instrumentsIds = instrumentsDocs.map(doc => doc._id);

  const startDate = moment('2010-11-01 00:00:00.000Z').utc();
  const endDate = moment('2022-01-01 00:00:00.000Z').utc();

  const deleteMatch = {
    instrument_id: { $in: instrumentsIds },

    $and: [{
      time: { $gte: startDate },
    }, {
      time: { $lt: endDate },
    }],
  };

  // await Candle1m.deleteMany(deleteMatch).exec();
  // await Candle5m.deleteMany(deleteMatch).exec();
  await Candle1h.deleteMany(deleteMatch).exec();
  await Candle4h.deleteMany(deleteMatch).exec();
  await Candle1d.deleteMany(deleteMatch).exec();

  console.timeEnd('migration');
};
