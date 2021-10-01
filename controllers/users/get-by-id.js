const {
  isMongoId,
} = require('validator');

const {
  getById,
} = require('./utils/get-by-id');

const User = require('../../models/User');

module.exports = async (req, res, next) => {
  const {
    params: {
      userid,
    },
  } = req;

  if (!userid || !isMongoId(userid)) {
    return res.json({
      status: false,
      message: 'No or invalid userid',
    });
  }

  const resultGet = await getById({
    userId: userid,
  });

  if (!resultGet || !resultGet.status) {
    return res.json({
      status: false,
      message: resultGet.message || 'Cant getById',
    });
  }

  return res.json({
    status: true,
    result: resultGet.result,
  });
};
