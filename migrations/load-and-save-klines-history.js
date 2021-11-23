const fs = require('fs');
const path = require('path');
const util = require('util');
const axios = require('axios');
const xml2js = require('xml2js');
const moment = require('moment');
const AdmZip = require('adm-zip');

const {
  sleep,
} = require('../libs/support');

const {
  parseCSVToJSON,
} = require('../controllers/files/utils/parse-csv-to-json');

const {
  create1mCandles,
} = require('../controllers/candles/utils/create-1m-candles');

const {
  create5mCandles,
} = require('../controllers/candles/utils/create-5m-candles');

const log = require('../libs/logger');

const InstrumentNew = require('../models/InstrumentNew');

const LOAD_PERIOD = '1m';

xml2js.parseStringPromise = util.promisify(xml2js.parseString);

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  const instrumentsDocs = await InstrumentNew
    .find({
      is_active: true,
      is_futures: true,
    })
    .sort({ name: 1 })
    .exec();

  if (!instrumentsDocs || !instrumentsDocs.length) {
    console.timeEnd('migration');
    return true;
  }

  let processedInstruments = 0;
  const totalInstruments = instrumentsDocs.length;

  const checkInterval = setInterval(() => {
    log.info(`${processedInstruments} / ${totalInstruments}`);
  }, 10 * 1000);

  const targetDates = [];

  const startToday = moment().utc().startOf('day');
  const monthAgo = moment(startToday).utc().add(-1, 'months').startOf('day');

  const tmpDate = moment(monthAgo);

  while (1) {
    targetDates.push({
      day: moment(tmpDate).format('DD'),
      month: moment(tmpDate).format('MM'),
      year: moment(tmpDate).format('YYYY'),
    });

    tmpDate.add(1, 'days');

    if (tmpDate.unix() === startToday.unix()) {
      break;
    }
  }

  for (const instrumentDoc of instrumentsDocs) {
    console.log(`Started ${instrumentDoc.name}`);

    let typeInstrument = 'spot';
    let instrumentName = instrumentDoc.name;

    if (!instrumentDoc.is_futures) {

    } else {
      typeInstrument = 'futures/um'
      instrumentName = instrumentDoc.name.replace('PERP', '');
    }

    const pathToFolder = path.join(__dirname, `../files/klines/daily/${LOAD_PERIOD}/${instrumentDoc.name}`);

    if (!fs.existsSync(pathToFolder)) {
      fs.mkdirSync(pathToFolder);
    }

    const links = targetDates.map(date => `data/${typeInstrument}/daily/klines/${instrumentName}/${LOAD_PERIOD}/${instrumentName}-${LOAD_PERIOD}-${date.year}-${date.month}-${date.day}.zip`);

    // const links = [{
    //   link: `data/${typeInstrument}/daily/klines/${instrumentName}/${LOAD_PERIOD}/${instrumentName}-${LOAD_PERIOD}-2021-11-04.zip`,
    // }];

    for (const link of links) {
      console.log(`${instrumentDoc.name}: started load file ${link}`);

      try {
        const resultGetFile = await axios({
          method: 'get',
          url: `https://data.binance.vision/${link}`,
          responseType: 'arraybuffer',
        });

        const zip = new AdmZip(resultGetFile.data);
        zip.extractAllTo(pathToFolder, true);
      } catch (error) {
        console.log(`${link}: `, error);
      }

      await sleep(5000);
    }

    const filesNames = [];

    fs
      .readdirSync(pathToFolder)
      .forEach(fileName => {
        filesNames.push(fileName);
      });

    for (const fileName of filesNames) {
      const pathToFile = `${pathToFolder}/${fileName}`;

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

        const resultCreateCandle = await create1mCandles({
          isFutures: instrumentDoc.is_futures,

          newCandles: [{
            instrumentId: instrumentDoc._id,
            startTime: new Date(parseInt(openTime, 10)),
            open,
            close,
            high,
            low,
            volume,
          }],
        });

        if (!resultCreateCandle || !resultCreateCandle.status) {
          log.warn(resultCreateCandle.message || 'Cant createCandle');
        }
      }));
    }

    processedInstruments += 1;
    console.log(`Ended ${instrumentDoc.name}`);
  }

  clearInterval(checkInterval);
  console.timeEnd('migration');
};
