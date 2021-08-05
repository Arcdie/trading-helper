const path = require('path');
const moment = require('moment');

const logger = require('../../logger');

const {
  parseFromCSVToJSON,
} = require('../files/utils/parse-from-csv-to-json');

module.exports = async (req, res, next) => {
  const {
    name,
  } = req.query;

  if (!name) {
    return next('No name');
  }

  const resultParse = parseFromCSVToJSON({
    fileName: name,
    filePeriod: 'minute',
  }, (err, parsedFile) => {
    if (err) {
      logger.error(err);
      return next(err);
    }

    if (!parsedFile || !parsedFile.status) {
      logger.warn(parsedFile.message || 'Cant parseFromCSVToJSON');
      return next('Cant parseFromCSVToJSON');
    }

    const validFormat = [];

    parsedFile.result.forEach(elem => {
      const [
        date,
        time,
        open,
        high,
        low,
        close,
        volume,
      ] = elem[0].split(';');

      const [
        day,
        month,
        year,
      ] = date.split('/');

      const [
        hour,
        minute,
        second,
      ] = time.split(':');

      const momentDate = moment({
        day,
        month: parseInt(month, 10) - 1,
        year: `20${year}`,

        hour,
        minute,
        second,
      });

      validFormat.push({
        date: momentDate,
        time: moment(momentDate).unix(),

        open: parseFloat(open),
        close: parseFloat(close),
        high: parseFloat(high),
        low: parseFloat(low),

        volume,
      });
    });

    const sortedData = validFormat
      .sort((a, b) => {
        if (a.time < b.time) {
          return -1;
        } else if (a.time > b.time) {
          return 1;
        }

        return 0;
      });

    return res.json({
      status: true,
      data: sortedData,
    });
  });
};
