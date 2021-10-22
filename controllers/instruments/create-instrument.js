const {
  isUndefined,
} = require('lodash');

const {
  createInstrument,
} = require('./utils/create-instrument');

module.exports = async (req, res, next) => {
  const {
    body: {
      name,
      price,

      isFutures,
    },
  } = req;

  if (!name) {
    return res.json({
      status: false,
      text: 'No name',
    });
  }

  if (!price) {
    return res.json({
      status: false,
      text: 'No price',
    });
  }

  if (isUndefined(isFutures)) {
    return res.json({
      status: false,
      text: 'No isFutures',
    });
  }

  const resultCreate = await createInstrument({
    name,
    price,

    isFutures,
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
