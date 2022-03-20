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

const {
  create1hCandles,
} = require('../controllers/candles/utils/create-1h-candles');

const log = require('../libs/logger')(module);

const InstrumentNew = require('../models/InstrumentNew');

const LOAD_PERIOD = '1h';

xml2js.parseStringPromise = util.promisify(xml2js.parseString);

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  let createCandlesFunc;

  switch (LOAD_PERIOD) {
    case '1m': {
      createCandlesFunc = create1mCandles;
      break;
    }

    case '5m': {
      createCandlesFunc = create5mCandles;
      break;
    }

    case '1h': {
      createCandlesFunc = create1hCandles;
      break;
    }

    default: {
      console.timeEnd('migration');
      return true;
    }
  }

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

  const incrementProcessedInstruments = processedInstrumentsCounter(instrumentsDocs.length);

  const targetDates = [];

  const startDate = moment().startOf('month').add(1, 'days').utc();
  const endDate = moment().startOf('day').utc();

  const tmpDate = moment(startDate);

  while (1) {
    targetDates.push({
      day: moment(tmpDate).format('DD'),
      month: moment(tmpDate).format('MM'),
      year: moment(tmpDate).format('YYYY'),
    });

    tmpDate.add(1, 'days');

    if (tmpDate.unix() === endDate.unix()) {
      break;
    }
  }

  for await (const instrumentDoc of instrumentsDocs) {
    console.log(`Started ${instrumentDoc.name}`);

    let typeInstrument = 'spot';
    let instrumentName = instrumentDoc.name;

    if (!instrumentDoc.is_futures) {

    } else {
      typeInstrument = 'futures/um';
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

    for await (const link of links) {
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

    for await (const fileName of filesNames) {
      const pathToFile = `${pathToFolder}/${fileName}`;

      const resultGetFile = await parseCSVToJSON({
        pathToFile,
      });

      if (!resultGetFile || !resultGetFile.status) {
        log.warn(resultGetFile.message || 'Cant parseCSVToJSON');
        continue;
      }

      const newCandles = resultGetFile.result.map(candleData => {
        const [
          openTime,
          open,
          high,
          low,
          close,
          volume,
          closeTime,
        ] = candleData;

        return {
          instrumentId: instrumentDoc._id,
          startTime: new Date(parseInt(openTime, 10)),
          open,
          close,
          high,
          low,
          volume,
        };
      });

      const resultCreateCandles = await createCandlesFunc({
        isFutures: instrumentDoc.is_futures,
        newCandles,
      });

      if (!resultCreateCandles || !resultCreateCandles.status) {
        log.warn(resultCreateCandles.message || 'Cant createCandlesFunc');
      }
    }

    incrementProcessedInstruments();
    console.log(`Ended ${instrumentDoc.name}`);
  }

  console.timeEnd('migration');
};

const processedInstrumentsCounter = function (numberInstruments = 0) {
  let processedInstruments = 0;

  return function () {
    processedInstruments += 1;
    log.info(`${processedInstruments} / ${numberInstruments}`);
  };
};
