const fs = require('fs');
const path = require('path');
const axios = require('axios');
const moment = require('moment');
const AdmZip = require('adm-zip');

const {
  sleep,
} = require('../libs/support');

const log = require('../libs/logger');

const InstrumentNew = require('../models/InstrumentNew');

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  const instrumentsDocs = await InstrumentNew.find({
    is_active: true,

    is_futures: false,
  }).exec();

  if (!instrumentsDocs || !instrumentsDocs.length) {
    console.timeEnd('migration');
    return true;
  }

  const arrDates = [{
    day: 24,
    month: 10,
    year: 2021,
  }];

  let processedInstruments = 0;
  const totalInstruments = instrumentsDocs.length;

  const checkInterval = setInterval(() => {
    log.info(`${processedInstruments} / ${totalInstruments}`);
  }, 10 * 1000);

  for (const doc of instrumentsDocs) {
    const pathToFolder = path.join(__dirname, `../files/klines/daily/${doc.name}`);

    if (!fs.existsSync(pathToFolder)) {
      fs.mkdirSync(pathToFolder);
    }

    let docName;

    if (!doc.is_futures) {
      docName = doc.name;
    } else {
      docName = doc.name.replace('PERP', '');
    }

    for (const date of arrDates) {
      let link;
      const fileName = `${docName}-1m-${date.year}-${date.month}-${date.day}.zip`;

      if (!doc.is_futures) {
        link = `https://data.binance.vision/data/spot/daily/klines/${docName}/1m/${fileName}`;
      } else {
        link = `https://data.binance.vision/data/futures/um/daily/klines/${docName}/1m/${fileName}`;
      }

      const resultGetFile = await axios({
        method: 'GET',
        url: link,
        responseType: 'arraybuffer',
      });

      const zip = new AdmZip(resultGetFile.data);

      zip.extractAllTo(pathToFolder, true);
      await sleep(1000 * 3);
    }

    log.info(`Ended ${doc.name}`);
    processedInstruments += 1;
  }

  clearInterval(checkInterval);
  console.timeEnd('migration');
};

const saveFile = ({
  data,
  pathToFile,
}) => {
  const writer = fs.createWriteStream(pathToFile);

  return new Promise((resolve, reject) => {
    data.pipe(writer);

    let error = null;

    writer.on('error', err => {
      error = err;
      writer.close();
      reject(err);
    });

    writer.on('close', () => {
      if (!error) {
        resolve(true);
      }
    });
  });
};
