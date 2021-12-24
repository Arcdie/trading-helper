const fs = require('fs');
const path = require('path');
const util = require('util');
const axios = require('axios');
const xml2js = require('xml2js');
const moment = require('moment');
const AdmZip = require('adm-zip');

const {
  sleep,
  getQueue,
} = require('../libs/support');

const {
  parseCSVToJSON,
} = require('../controllers/files/utils/parse-csv-to-json');

const {
  getActiveInstruments,
} = require('../controllers/instruments/utils/get-active-instruments');

const log = require('../libs/logger')(module);

xml2js.parseStringPromise = util.promisify(xml2js.parseString);

module.exports = async () => {
  try {
    return;
    console.time('migration');
    console.log('Migration started');

    const resultGetInstruments = await getActiveInstruments({
      isOnlyFutures: true,
    });

    if (!resultGetInstruments || !resultGetInstruments.status) {
      log.warn(resultGetInstruments.message || 'Cant getActiveInstruments');
      return false;
    }

    let instrumentsDocs = (resultGetInstruments.result || [])
      .filter(d => d.name !== 'ADAUSDTPERP');

    instrumentsDocs.splice(0, 48);

    if (!instrumentsDocs || !instrumentsDocs.length) {
      return false;
    }

    const targetDates = [];

    const startToday = moment().utc()
      .add(-1, 'days').startOf('day');

    const weekAgo = moment(startToday).utc()
      .add(-7, 'days').startOf('day');

    const tmpDate = moment(weekAgo);
    const incrementProcessedInstruments = processedInstrumentsCounter(instrumentsDocs.length);

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

    const pathToFrontFolder = path.join(__dirname, '../../trading-helper-front/public/files/aggTrades/weekly');

    for await (const instrumentDoc of instrumentsDocs) {
      log.info(`Started ${instrumentDoc.name}`);

      const typeInstrument = 'futures/um';
      const instrumentName = instrumentDoc.name.replace('PERP', '');

      const pathToFolder = `${pathToFrontFolder}/${instrumentDoc.name}`;

      if (!fs.existsSync(pathToFolder)) {
        fs.mkdirSync(pathToFolder);
      }

      const links = targetDates.map(date => `data/${typeInstrument}/daily/aggTrades/${instrumentName}/${instrumentName}-aggTrades-${date.year}-${date.month}-${date.day}.zip`);

      for await (const link of links) {
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

        await sleep(2000);
      }

      const filesNames = [];
      const weeklyFileData = [];

      fs
        .readdirSync(pathToFolder)
        .forEach(fileName => {
          filesNames.push(fileName);
        });

      let doRemove = true;

      for await (const fileName of filesNames) {
        if (fileName.includes('.json')) {
          continue;
        }

        const pathToFile = `${pathToFolder}/${fileName}`;

        const stats = fs.statSync(pathToFile);
        const fileSizeInMegabytes = stats.size / (1024 * 1024);

        if (fileSizeInMegabytes > 50) {
          doRemove = false;
          console.log(`${instrumentDoc.name} is too large`);
        }

        if (doRemove) {
          const resultGetFile = await parseCSVToJSON({
            pathToFile,
          });

          if (!resultGetFile || !resultGetFile.status) {
            log.warn(resultGetFile.message || 'Cant parseCSVToJSON');
            continue;
          }

          const validResult = [];

          resultGetFile.result.forEach(elem => {
            const [tradeId, price, quantity, firstTradeId, lastTradeId, timestamp, direction] = elem;
            validResult.push([price, quantity, timestamp]);
          });

          const queues = getQueue(validResult, 100000);

          queues.forEach(queue => {
            weeklyFileData.push(...queue);
          });

          fs.unlinkSync(pathToFile);
        }
      }

      if (doRemove) {
        fs.writeFileSync(
          `${pathToFolder}/${instrumentDoc.name}.json`,
          JSON.stringify(weeklyFileData),
        );
      }

      incrementProcessedInstruments();
      log.info(`Ended ${instrumentDoc.name}`);
    }

    console.timeEnd('migration');
  } catch (error) {
    console.log(error);
  }
};

const processedInstrumentsCounter = function (numberInstruments = 0) {
  let processedInstruments = 0;

  return function () {
    processedInstruments += 1;
    log.info(`${processedInstruments} / ${numberInstruments}`);
  };
};
