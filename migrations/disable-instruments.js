const InstrumentNew = require('../models/InstrumentNew');

const Candle1m = require('../models/Candle-1m');
const Candle5m = require('../models/Candle-5m');
const Candle1h = require('../models/Candle-1h');
const Candle4h = require('../models/Candle-4h');
const Candle1d = require('../models/Candle-1d');

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  const instrumentsDocs = await InstrumentNew.find({
    is_active: true,
  }).exec();

  const targetInstrumentDocs = instrumentsDocs
    .filter(d => d.average_volume_for_last_24_hours === 0);

  if (!targetInstrumentDocs || !targetInstrumentDocs.length) {
    console.timeEnd('migration');
    return true;
  }

  await Promise.all(targetInstrumentDocs.map(async doc => {
    doc.is_active = false;
    await doc.save();
  }));

  const instrumentIds = targetInstrumentDocs.map(d => d._id);

  await Candle1m.deleteMany({ instrument_id: { $in: instrumentIds } }).exec();
  await Candle5m.deleteMany({ instrument_id: { $in: instrumentIds } }).exec();
  await Candle1h.deleteMany({ instrument_id: { $in: instrumentIds } }).exec();
  await Candle4h.deleteMany({ instrument_id: { $in: instrumentIds } }).exec();
  await Candle1d.deleteMany({ instrument_id: { $in: instrumentIds } }).exec();

  console.timeEnd('migration');
};
