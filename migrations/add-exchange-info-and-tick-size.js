const {
  getSpotExchangeInfo,
} = require('../controllers/binance/utils/spot/get-spot-exchange-info');

const {
  getFuturesExchangeInfo,
} = require('../controllers/binance/utils/futures/get-futures-exchange-info');

const InstrumentNew = require('../models/InstrumentNew');

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  const instrumentsDocs = await InstrumentNew.find({}).exec();

  await Promise.all(instrumentsDocs.map(async doc => {
    doc.precision = undefined;
    doc.tick_size = undefined;
    await doc.save();
  }));

  /*
  const spotDocs = instrumentsDocs.filter(doc => !doc.is_futures);
  const futuresDocs = instrumentsDocs.filter(doc => doc.is_futures);

  if (spotDocs.length) {
    const resultGetExchangeInfo = await getSpotExchangeInfo();

    if (!resultGetExchangeInfo || !resultGetExchangeInfo.status) {
      console.log(resultGetExchangeInfo.message || 'Cant getSpotExchangeInfo');
      return false;
    }

    await Promise.all(spotDocs.map(async doc => {
      const targetSymbol = resultGetExchangeInfo.result.symbols
        .find(symbol => symbol.symbol === doc.name);

      if (!targetSymbol) {
        console.log('Spot: Cant find ', doc.name);
        return null;
      }

      if (!targetSymbol.pricePrecision) {
        console.log('Spot: Invalid pricePrecision', doc.name);
        return null;
      }

      const pricePrecision = targetSymbol.pricePrecision || 0;
      const tickSize = parseFloat(targetSymbol.filters[0].tickSize);

      doc.tick_size = tickSize;
      doc.price_precision = pricePrecision;
      await doc.save();
    }));
  }

  if (futuresDocs.length) {
    const resultGetExchangeInfo = await getFuturesExchangeInfo();

    if (!resultGetExchangeInfo || !resultGetExchangeInfo.status) {
      console.log(resultGetExchangeInfo.message || 'Cant getFuturesExchangeInfo');
      return false;
    }

    await Promise.all(futuresDocs.map(async doc => {
      const docName = doc.name.replace('PERP', '');

      const targetSymbol = resultGetExchangeInfo.result.symbols
        .find(symbol => symbol.symbol === docName);

      if (!targetSymbol) {
        console.log('Futures: Cant find ', doc.name);
        return null;
      }

      if (!targetSymbol.pricePrecision) {
        console.log('Futures: Invalid pricePrecision', doc.name);
        return null;
      }

      const pricePrecision = targetSymbol.pricePrecision || 0;
      const tickSize = parseFloat(targetSymbol.filters[0].tickSize);

      doc.tick_size = tickSize;
      doc.price_precision = pricePrecision;
      await doc.save();
    }));
  }
  */

  console.timeEnd('migration');
};
