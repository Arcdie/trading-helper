const {
  isMongoId,
} = require('validator');

const log = require('../../libs/logger')(module);

const {
  getById,
} = require('./utils/get-by-id');

module.exports = async (req, res, next) => {
  try {
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
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
