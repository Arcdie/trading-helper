const getTicksForSpotInstruments = require('./spot/get-ticks-for-spot-instruments');
const getPricesForSpotInstruments = require('./spot/get-prices-for-spot-instruments');
const getLimitOrdersForSpotInstruments = require('./spot/get-limit-orders-for-spot-instruments');

const getTicksForFuturesInstruments = require('./futures/get-ticks-for-futures-instruments');
const getPricesForFuturesInstruments = require('./futures/get-prices-for-futures-instruments');
const getLimitOrdersForFuturesInstruments = require('./futures/get-limit-orders-for-futures-instruments');

module.exports = async (instrumentsDocs = []) => {
  const futuresDocs = instrumentsDocs
    .filter(doc => doc.is_futures).map(doc => doc._doc);

  const spotDocs = instrumentsDocs
    .filter(doc => !doc.is_futures).map(doc => doc._doc);

  /* set websocket connections */
  // await getTicksForSpotInstruments(spotDocs); // вродеэтот красавчик
  // await getPricesForSpotInstruments(spotDocs); // поднимается, потом опускается до нормального
  await getLimitOrdersForSpotInstruments(spotDocs);

  // await getTicksForFuturesInstruments(futuresDocs); // этот красавчик
  // await getPricesForFuturesInstruments(futuresDocs); // поднимается, потом опускается до нормального
  await getLimitOrdersForFuturesInstruments(futuresDocs);
  /* end */
};
