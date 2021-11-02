const {
  getActiveInstruments,
} = require('./utils/get-active-instruments');

module.exports = async (req, res, next) => {
  const {
    query: {
      isOnlyFutures,
    },
  } = req;

  const funcObj = {};

  if (isOnlyFutures && isOnlyFutures === 'true') {
    funcObj.isOnlyFutures = true;
  } else {
    funcObj.isOnlyFutures = false;
  }

  const resultGetInstruments = await getActiveInstruments(funcObj);

  if (!resultGetInstruments || !resultGetInstruments.status) {
    return res.json({
      status: false,
      message: resultGetInstruments.message || 'Cant getActiveInstruments',
    });
  }

  return res.json({
    status: true,
    result: resultGetInstruments.result,
  });
};
