const findOneById = require('./find-one-by-id');
const findManyById = require('./find-many-by-id');
const findManyByName = require('./find-many-by-name');
const getActiveInstruments = require('./get-active-instruments');
const getInstrumentsWithActiveRobots = require('./get-instruments-with-active-robots');

const createInstrument = require('./create-instrument');
const updateInstrument = require('./update-instrument');

const uploadNewInstrumentsFromBinance = require('./upload-new-instuments-from-binance');

module.exports = {
  findOneById,
  findManyById,
  findManyByName,
  getActiveInstruments,
  getInstrumentsWithActiveRobots,

  createInstrument,
  updateInstrument,

  uploadNewInstrumentsFromBinance,
};
