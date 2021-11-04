const InstrumentNew = require('../../../models/InstrumentNew');

const getActiveInstruments = async ({
  isOnlyFutures,
}) => {
  const matchObj = {
    is_active: true,
  };

  if (isOnlyFutures) {
    matchObj.is_futures = true;
  }

  const instrumentsDocs = await InstrumentNew
    .find(matchObj)
    // .sort({ name: 1 })
    // .limit(5)
    .exec();

  return {
    status: true,
    result: instrumentsDocs.map(doc => doc._doc),
  };
};

module.exports = {
  getActiveInstruments,
};
