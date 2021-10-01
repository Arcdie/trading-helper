const log = require('../libs/logger');

const {
  getBinanceInstruments,
} = require('../controllers/binance/utils/get-binance-instruments');

const Instrument = require('../models/Instrument');

module.exports = async () => {
  const instrumentsDocs = await Instrument.find({}, {
    name_futures: 1,
  }).exec();

  const instrumentsWithoutPERP = instrumentsDocs.map(doc => ({
    _id: doc._id,
    name: doc.name_futures.replace('PERP', ''),
  }));

  setInterval(async () => {
    const resultGetInstruments = await getBinanceInstruments();

    if (resultGetInstruments && resultGetInstruments.status) {
      await Promise.all(resultGetInstruments.result.map(async elem => {
        const instrumentDoc = instrumentsWithoutPERP.find(doc => doc.name === elem.symbol);

        if (!instrumentDoc) {
          return null;
        }

        await Instrument.findByIdAndUpdate(instrumentDoc._id, {
          price: elem.price,
          updated_at: new Date(),
        }).exec();
      }));

      log.info('Prices for instruments were updated successfully');
    }
  }, 1000 * 60); // 1 minutes
};
