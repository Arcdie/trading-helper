const InstrumentNew = require('../../../models/InstrumentNew');

const getActiveInstruments = async ({
  isOnlyFutures,
}) => {
  const matchObj = {
    is_active: true,
    name: 'IOTAUSDTPERP',
  };

  if (isOnlyFutures) {
    matchObj.is_futures = true;
  }

  const instrumentsDocs = await InstrumentNew
    .find(matchObj)
    // .sort({ name: 1 })
    // .limit(10)
    .exec();

  return {
    status: true,
    result: instrumentsDocs.map(doc => doc._doc),
  };
};

module.exports = {
  getActiveInstruments,
};
