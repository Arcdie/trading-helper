const {
  createInstrument,
} = require('./utils/create-instrument');

module.exports = async (req, res, next) => {
  const {
    body: {
      name,
    },
  } = req;

  if (!name) {
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
