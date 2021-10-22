const InstrumentNew = require('../../../models/InstrumentNew');

const getActiveInstruments = async () => {
  const instrumentsDocs = await InstrumentNew.find({
    is_active: true,
  }).exec();

  return {
    status: true,
    result: instrumentsDocs.map(doc => doc._doc),
  };
};

module.exports = {
  getActiveInstruments,
};
