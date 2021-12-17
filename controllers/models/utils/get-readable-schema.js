const {
  isEmpty,
} = require('lodash');

const log = require('../../../libs/logger')(module);

const getReadableSchema = (modelSchema = {}) => {
  try {
    if (!modelSchema || isEmpty(modelSchema)) {
      const message = 'No or empty modelSchema';
      log.warn(message);
      return false;
    }

    const readableSchema = {};

    Object.keys(modelSchema).forEach(keyOfSchema => {
      if (modelSchema[keyOfSchema][0]) {
        // element is array

        readableSchema[keyOfSchema] = [];

        const lElements = modelSchema[keyOfSchema].length;

        for (let i = 0; i < lElements; i += 1) {
          readableSchema[keyOfSchema][i] = {};

          const nameOfFunction = modelSchema[keyOfSchema][i].type.name;
          readableSchema[keyOfSchema][i].type = nameOfFunction;

          Object.keys(modelSchema[keyOfSchema][i]).forEach(key => {
            if (key === 'type') {
              return true;
            }

            if (key === 'default') {
              if (typeof modelSchema[keyOfSchema][i][key] === 'function') {
                const nameOfFunction = modelSchema[keyOfSchema][i][key].name;
                readableSchema[keyOfSchema][i][key] = nameOfFunction;

                return true;
              }
            }

            readableSchema[keyOfSchema][i][key] = modelSchema[keyOfSchema][i][key];
          });
        }
      } else {
        // element is object

        readableSchema[keyOfSchema] = {};

        if (!modelSchema[keyOfSchema].type) {
          // element has attachment

          Object.keys(modelSchema[keyOfSchema]).forEach(i => {
            readableSchema[keyOfSchema][i] = {};

            const nameOfFunction = modelSchema[keyOfSchema][i].type.name;
            readableSchema[keyOfSchema][i].type = nameOfFunction;

            Object.keys(modelSchema[keyOfSchema][i]).forEach(key => {
              if (key === 'type') {
                return true;
              }

              if (key === 'default') {
                if (typeof modelSchema[keyOfSchema][i][key] === 'function') {
                  const nameOfFunction = modelSchema[keyOfSchema][i][key].name;
                  readableSchema[keyOfSchema][i][key] = nameOfFunction;

                  return true;
                }
              }

              readableSchema[keyOfSchema][i][key] = modelSchema[keyOfSchema][i][key];
            });
          });
        } else {
          const nameOfFunction = modelSchema[keyOfSchema].type.name;
          readableSchema[keyOfSchema].type = nameOfFunction;

          Object.keys(modelSchema[keyOfSchema]).forEach(key => {
            if (key === 'type') {
              return true;
            }

            if (key === 'default') {
              if (typeof modelSchema[keyOfSchema][key] === 'function') {
                const nameOfFunction = modelSchema[keyOfSchema][key].name;
                readableSchema[keyOfSchema][key] = nameOfFunction;

                return true;
              }
            }

            readableSchema[keyOfSchema][key] = modelSchema[keyOfSchema][key];
          });
        }
      }
    });


    return readableSchema;
  } catch (error) {
    log.warn(error.message);
    console.log(error);
    return false;
  }
};

module.exports = {
  getReadableSchema,
};
