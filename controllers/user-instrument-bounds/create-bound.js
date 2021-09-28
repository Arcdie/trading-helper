// NOT USED

const {
  isMongoId,
} = require('validator');

const {
  createBound,
} = require('./utils/create-bound');

module.exports = async (req, res, next) => {
  const {
    body: {
      userId,
      instrumentId,
    },
  } = req;

  if (!userId) {
    return res.json({
      status: false,
      text: 'No name',
    });
  }

  const resultCreate = await createInstrument({
    name,
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
