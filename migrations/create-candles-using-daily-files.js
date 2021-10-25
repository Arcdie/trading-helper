const fs = require('fs');
const path = require('path');

const {
  parseCSVToJSON,
} = require('../controllers/files/utils/parse-csv-to-json');

const {
  createCandle,
} = require('../controllers/candles/utils/create-candle');

const log = require('../libs/logger');

const InstrumentNew = require('../models/InstrumentNew');

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  const instrumentsNames = [];
  const pathToDailyFolder = path.join(__dirname, '../files/klines/daily');

  fs
    .readdirSync(pathToDailyFolder)
    .forEach(folderName => {
      instrumentsNames.push(folderName);
    });

  if (!instrumentsNames.length) {
    console.timeEnd('migration');
    return true;
  }

  const instrumentsDocs = await InstrumentNew.find({
    name: {
      $in: instrumentsNames,
    },

    is_active: true,
  }).exec();

  if (!instrumentsDocs || !instrumentsDocs.length) {
    console.timeEnd('migration');
    return true;
  }

  let processedInstruments = 0;
  const totalInstruments = instrumentsDocs.length;

  const checkInterval = setInterval(() => {
    log.info(`${processedInstruments} / ${totalInstruments}`);
  }, 10 * 1000);

  for (const doc of instrumentsDocs) {
    const filesNames = [];
    const pathToInstrumentFolder = path.join(__dirname, `../files/klines/daily/${doc.name}`);

    fs
      .readdirSync(pathToInstrumentFolder)
      .forEach(fileName => {
        filesNames.push(fileName);
      });

    for (const fileName of filesNames) {
      const pathToFile = `${pathToInstrumentFolder}/${fileName}`;

      const resultGetFile = await parseCSVToJSON({
        pathToFile,
      });

      if (!resultGetFile || !resultGetFile.status) {
        log.warn(resultGetFile.message || 'Cant parseCSVToJSON');
        continue;
      }

      await Promise.all(resultGetFile.result.map(async data => {
        const [
          openTime,
          open,
          high,
          low,
          close,
          volume,
          closeTime,
        ] = data;

        const resultCreateCandle = await createCandle({
          instrumentId: doc._id,
          startTime: new Date(parseInt(openTime, 10)),
          open,
          close,
          high,
          low,
          volume,
        });

        if (!resultCreateCandle || !resultCreateCandle.status) {
          log.warn(resultCreateCandle.message || 'Cant createCandle');
        }
      }));
    }

    log.info(`Ended ${doc.name}`);
    processedInstruments += 1;
  }

  clearInterval(checkInterval);
  console.timeEnd('migration');
};
