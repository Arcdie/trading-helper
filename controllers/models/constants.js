const fs = require('fs');
const path = require('path');

const pathToModelsFolder = path.join(__dirname, '../../models');

const ACTIVE_MODELS = new Map();

fs
  .readdirSync(pathToModelsFolder)
  .forEach(fileName => {
    const Model = require(`${pathToModelsFolder}/${fileName}`);
    ACTIVE_MODELS.set(Model.modelName, Model.modelSchema);
  });

module.exports = {
  ACTIVE_MODELS,
};
