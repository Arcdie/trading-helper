const findManyByNames = require('./find-many-by-names');
const getInstrumentsWithActiveRobots = require('./get-instruments-with-active-robots');

const createInstrument = require('./create-instrument');

const uploadNewInstrumentsFromBinance = require('./upload-new-instuments-from-binance');

module.exports = {
  findManyByNames,
  getInstrumentsWithActiveRobots,

  createInstrument,

  uploadNewInstrumentsFromBinance,
};
