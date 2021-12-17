const log = require('../../libs/logger')(module);

const {
  getReadableSchema,
} = require('./utils/get-readable-schema');

const {
  ACTIVE_MODELS,
} = require('./constants');

module.exports = async (req, res, next) => {
  try {
    const result = [];

    ACTIVE_MODELS.forEach((modelSchema, modelName) => {
      result.push({
        modelName,
        modelSchema: getReadableSchema(modelSchema) || {},
      });
    });

    return res.json({
      status: true,
      result,
    });
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
