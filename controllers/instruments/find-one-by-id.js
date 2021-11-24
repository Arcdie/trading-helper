const {
  isMongoId,
} = require('validator');

const {
  findOne,
} = require('./utils/find-one');

module.exports = async (req, res, next) => {
  const {
    params: {
      id: instrumentId,
    },

    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  if (!instrumentId || !isMongoId(instrumentId)) {
    return res.json({
      status: false,
      message: 'No or invalid instrumentId',
    });
  }

  const resultGetOne = await findOne({
    instrumentId,
  });

  if (!resultGetOne || !resultGetOne.status) {
    return res.json({
      status: false,
      message: resultGetOne.message || 'Cant findOne',
    });
  }

  return res.json({
    status: true,
    result: resultGetOne.result,
  });
};
