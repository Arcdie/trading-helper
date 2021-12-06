const log = require('../../libs/logger')(module);

const {
  getById,
} = require('./utils/get-by-id');

module.exports = async (req, res, next) => {
  try {
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
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
