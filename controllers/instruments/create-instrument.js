const {
  isUndefined,
} = require('lodash');

const log = require('../../libs/logger')(module);

const {
  createInstrument,
} = require('./utils/create-instrument');

module.exports = async (req, res, next) => {
  try {
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
        message: 'No name',
      });
    }

    if (!price) {
      return res.json({
        status: false,
        message: 'No price',
      });
    }

    if (isUndefined(isFutures)) {
      return res.json({
        status: false,
        message: 'No isFutures',
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
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
