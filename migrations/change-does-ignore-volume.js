const {
  renewInstrumentsInRedis,
} = require('../controllers/instruments/utils/renew-instruments-in-redis');

const InstrumentNew = require('../models/InstrumentNew');

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  const instrumentsDocs = await InstrumentNew.find({}, {
    name: 1,
    does_ignore_volume: 1,
  }).exec();

  const arr = ["BNBUSDT","LTCUSDT","LINKUSDT","HOTUSDT","DASHUSDT","CELRUSDT","NKNUSDT","CHZUSDT","SOLUSDT","ZENUSDT","SUSHIUSDT","MANAUSDT","BELUSDT","UNIUSDT","ALPHAUSDT","AUDIOUSDT","RUNEUSDT","CELOUSDT","NEARUSDT","LITUSDT","BAKEUSDT","ICPUSDT","C98USDT","BALUSDT","ZRXUSDT","XTZUSDT","CHRUSDT","WAVESUSDT","MKRUSDT","AXSUSDT","SFPUSDT","BTTUSDT","ALGOUSDT","YFIIUSDT","CTKUSDT","AKROUSDT","KLAYUSDT","GALAUSDT","RAYUSDT","TRBUSDT","XEMUSDT","RENUSDT","UNFIUSDT","ADAUSDT","ZILUSDT","COMPUSDT","SNXUSDT","CRVUSDT","1INCHUSDT","AAVEUSDT","HBARUSDT"];

  await Promise.all(instrumentsDocs.map(async doc => {
    doc.does_ignore_volume = true;

    if (arr.includes(doc.name)) {
      doc.does_ignore_volume = false;
    }

    await doc.save();
  }));

  await renewInstrumentsInRedis();

  console.timeEnd('migration');
};
