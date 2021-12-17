const log = require('../../libs/logger')(module);

const {
  getReadableSchema,
} = require('./utils/get-readable-schema');

const {
  ACTIVE_MODELS,
} = require('./constants');

module.exports = async (req, res, next) => {
  try {
    const {
      params: {
        modelName,
      },
    } = req;

    if (!modelName || !ACTIVE_MODELS.get(modelName)) {
      return res.json({
        status: false,
        message: 'No or invalid modelName',
      });
    }

    const targetSchema = ACTIVE_MODELS.get(modelName);

    return res.json({
      status: true,
      result: {
        modelName,
        modelSchema: getReadableSchema(targetSchema) || {},
      },
    });
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
