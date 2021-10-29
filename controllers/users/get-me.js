const {
  isMongoId,
} = require('validator');

const {
  getById,
} = require('./utils/get-by-id');

const User = require('../../models/User');

module.exports = async (req, res, next) => {
  const {
    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  const resultGetById = await getById({
    userId: user._id,
  });

  if (!resultGetById || !resultGetById.status) {
    return res.json({
      status: false,
      message: resultGetById.message || 'Cant getById',
    });
  }

  return res.json({
    status: true,
    result: resultGetById.result,
  });
};
