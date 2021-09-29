const log = require('../logger');

const {
  getPrices,
} = require('../controllers/binance/utils/get-prices');

const Instrument = require('../models/Instrument');

module.exports = async () => {
  const instrumentsDocs = await Instrument.find({}, {
    name: 1,
  }).exec();

  const instrumentsWithoutPERP = instrumentsDocs.map(doc => ({
    _id: doc._id,
    name: doc.name.replace('PERP', ''),
  }));

  setInterval(async () => {
    const resultGetPrices = await getPrices();

    if (resultGetPrices && resultGetPrices.status) {
      await Promise.all(resultGetPrices.result.map(async elem => {
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
