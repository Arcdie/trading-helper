const {
  getActiveInstruments,
} = require('./utils/get-active-instruments');

module.exports = async (req, res, next) => {
  const {
    query: {
      isOnlyFutures,
      doesExistRobot,
    },
  } = req;

  const funcObj = {
    isOnlyFutures: (isOnlyFutures && isOnlyFutures === 'true'),
    doesExistRobot: (doesExistRobot && doesExistRobot === 'true'),
  };

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
