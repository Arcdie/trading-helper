const {
  createInstrument,
} = require('./utils/create-instrument');

module.exports = async (req, res, next) => {
  const {
    body: {
      nameSpot,
      nameFutures,
    },
  } = req;

  if (!nameSpot) {
    return res.json({
      status: false,
      text: 'No nameSpot',
    });
  }

  if (!nameFutures) {
    return res.json({
      status: false,
      text: 'No nameFutures',
    });
  }

  const resultCreate = await createInstrument({
    nameSpot,
    nameFutures,

    isActive: true,
  });

  if (!resultCreate) {
    return res.json({
      status: false,
      result: resultCreate.result || 'Cant createInstrument',
    });
  }

  return res.json({
    status: true,
    result: resultCreate.result,
  });
};
