const getTicksForSpotInstruments = require('./spot/get-ticks-for-spot-instruments');
const getPricesForSpotInstruments = require('./spot/get-prices-for-spot-instruments');
const getLimitOrdersForSpotInstruments = require('./spot/get-limit-orders-for-spot-instruments');

const getTicksForFuturesInstruments = require('./futures/get-ticks-for-futures-instruments');
const getPricesForFuturesInstruments = require('./futures/get-prices-for-futures-instruments');
const getLimitOrdersForFuturesInstruments = require('./futures/get-limit-orders-for-futures-instruments');

module.exports = async (instrumentsDocs = []) => {
  const spotDocs = instrumentsDocs
    .filter(doc => !doc.is_futures).map(doc => doc._doc);

  const futuresDocs = instrumentsDocs
    .filter(doc => doc.is_futures).map(doc => doc._doc);

  const spotDocsWithoutIgnoredVolume = spotDocs
    .filter(doc => !doc.does_ignore_volume);

  const futuresDocsWithoutIgnoredVolume = futuresDocs
    .filter(doc => !doc.does_ignore_volume);

  /* set websocket connections */
  await getTicksForSpotInstruments(spotDocs);
  await getPricesForSpotInstruments(spotDocs);
  await getLimitOrdersForSpotInstruments(spotDocsWithoutIgnoredVolume);

  await getTicksForFuturesInstruments(futuresDocs);
  await getPricesForFuturesInstruments(futuresDocs);
  await getLimitOrdersForFuturesInstruments(futuresDocsWithoutIgnoredVolume);
  /* end */
};
