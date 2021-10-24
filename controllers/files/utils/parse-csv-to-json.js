const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');

const log = require('../../../libs/logger');

const parseCSVToJSON = ({
  pathToFile,
}) => {
  return new Promise((resolve, reject) => {
    const data = [];

    try {
      fs.createReadStream(pathToFile)
        .pipe(csv.parse())
        .on('error', error => ({
          status: false,
          message: error,
        }))
        .on('data', row => data.push(row))
        .on('end', () => resolve({
          status: true,
          result: data,
        }));
    } catch (err) {
      reject({
        status: false,
        message: err.message,
      });
    }
  });
};

module.exports = {
  parseCSVToJSON,
};
