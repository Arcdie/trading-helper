const findById = require('./find-by-id');
const findManyByNames = require('./find-many-by-names');
const getInstrumentsWithActiveRobots = require('./get-instruments-with-active-robots');

const createInstrument = require('./create-instrument');

const uploadNewInstrumentsFromBinance = require('./upload-new-instuments-from-binance');

module.exports = {
  findById,
  findManyByNames,
  getInstrumentsWithActiveRobots,

  createInstrument,

  uploadNewInstrumentsFromBinance,
};
