const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');

const log = require('../../../libs/logger');

const parseFromCSVToJSON = ({
  fileName,
  filePeriod,
}, callback) => {
  const data = [];

  try {
    fs.createReadStream(path.resolve(__dirname, `../../../files/${filePeriod}`, `${fileName}.csv`))
      .pipe(csv.parse())
      .on('error', error => ({
        status: false,
        message: error,
      }))
      .on('data', row => data.push(row))
      .on('end', () => callback(null, {
        status: true,
        result: data,
      }));
  } catch (err) {
    callback(null, {
      status: false,
      message: err.message,
    });
  }
};

module.exports = {
  parseFromCSVToJSON,
};
