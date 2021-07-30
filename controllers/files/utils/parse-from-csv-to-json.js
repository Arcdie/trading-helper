const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');

const log = require('../../../logger');

const parseFromCSVToJSON = ({
  fileName,
  filePeriod,
}, callback) => {
  const data = [];

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
};

module.exports = {
  parseFromCSVToJSON,
};
