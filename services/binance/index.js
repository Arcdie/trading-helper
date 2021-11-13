const get5mCandlesForSpotInstruments = require('./spot/get-5m-candles-for-spot-instruments');
const getLimitOrdersForSpotInstruments = require('./spot/get-limit-orders-for-spot-instruments');

const getUsersDataForFutures = require('./futures/get-users-data-for-futures');
const getAggTradesForFuturesInstruments = require('./futures/get-agg-trades-for-futures-instruments');
const get5mCandlesForFuturesInstruments = require('./futures/get-5m-candles-for-futures-instruments');
const getLimitOrdersForFuturesInstruments = require('./futures/get-limit-orders-for-futures-instruments');

module.exports = async (instrumentsDocs = []) => {
  const spotDocs = instrumentsDocs
    .filter(doc => !doc.is_futures).map(doc => doc._doc);

  const futuresDocs = instrumentsDocs
    .filter(doc => doc.is_futures).map(doc => doc._doc);

  const spotDocsWithoutIgnoredVolume = spotDocs
    .filter(doc => !doc.does_ignore_volume);

  const futuresDocsWithActiveRobots = futuresDocs
    .filter(doc => doc.does_exist_robot);

  const futuresDocsWithoutIgnoredVolume = futuresDocs
    .filter(doc => !doc.does_ignore_volume);

  /* set websocket connections */
  await get5mCandlesForSpotInstruments(spotDocs);
  await getLimitOrdersForSpotInstruments(spotDocsWithoutIgnoredVolume);

  await getUsersDataForFutures();
  await get5mCandlesForFuturesInstruments(futuresDocs);
  await getAggTradesForFuturesInstruments(futuresDocsWithActiveRobots);
  await getLimitOrdersForFuturesInstruments(futuresDocsWithoutIgnoredVolume);
  /* end */
};
