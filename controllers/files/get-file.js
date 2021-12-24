const fs = require('fs');
const path = require('path');

const {
  parseCSVToJSON,
} = require('./utils/parse-csv-to-json');

const log = require('../../libs/logger')(module);

module.exports = async (req, res, next) => {
  try {
    const {
      query: {
        fileName,
        fileExtension,
      },

      user,
    } = req;

    if (!user) {
      return res.json({
        status: false,
        message: 'Not authorized',
      });
    }

    if (!fileName) {
      return res.json({
        status: false,
        message: 'No fileName',
      });
    }

    if (!fileExtension || !['csv'].includes(fileExtension)) {
      return res.json({
        status: false,
        message: 'No or invalid fileExtension',
      });
    }

    const validFileName = fileName.replace(/\./g, '');
    const pathToFile = path.join(__dirname, `../../files/${validFileName}.${fileExtension}`);

    const doesExistFile = await fs.existsSync(pathToFile);

    if (!doesExistFile) {
      return res.json({
        status: false,
        message: 'No file',
      });
    }

    let fileData;

    if (fileExtension === 'csv') {
      fileData = await parseCSVToJSON({
        pathToFile,
      });

      if (!fileData || !fileData.status) {
        const message = fileData.message || 'Cant parseCSVToJSON';
        log.warn(message);

        return res.json({
          status: false,
          message,
        });
      }
    } else {
      fileData = await fs.promises.readFile(pathToFile);
    }

    return res.json({
      status: true,
      result: fileData,
    });
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
