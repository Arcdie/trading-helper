const {
  isMongoId,
} = require('validator');

const {
  isEmpty,
  isUndefined,
} = require('lodash');

const {
  updateInstrument,
} = require('./utils/update-instrument');

module.exports = async (req, res, next) => {
  const {
    params: {
      id: instrumentId,
    },

    body: {
      doesIgnoreVolume,
    },
  } = req;

  if (!instrumentId || !isMongoId(instrumentId)) {
    return res.json({
      status: false,
      text: 'No or invalid instrumentId',
    });
  }

  const updateObj = {
    instrumentId,
  };

  if (!isUndefined(doesIgnoreVolume)) {
    updateObj.doesIgnoreVolume = doesIgnoreVolume;
  }

  if (!isEmpty(updateObj)) {
    const resultUpdate = await updateInstrument(updateObj);

    if (!resultUpdate) {
      return res.json({
        status: false,
        result: resultUpdate.result || 'Cant updateInstrument',
      });
    }
  }

  return res.json({
    status: true,
  });
};
