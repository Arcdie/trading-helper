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

const log = require('../libs/logger');

const InstrumentNew = require('../models/InstrumentNew');

xml2js.parseStringPromise = util.promisify(xml2js.parseString);

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  const instrumentsDocs = await InstrumentNew
    .find({
      _id: {
        $nin: ['616f0f7190a7836ed8d5e19f', '616f0f7290a7836ed8d5e23f'],
      },

      is_active: true,
      does_exist_robot: true,
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

    const pathToFolder = path.join(__dirname, `../files/aggTrades/daily/${instrumentDoc.name}`);

    if (!fs.existsSync(pathToFolder)) {
      fs.mkdirSync(pathToFolder);
    }

    const links = targetDates.map(date => `data/${typeInstrument}/daily/aggTrades/${instrumentName}/${instrumentName}-aggTrades-${date.year}-${date.month}-${date.day}.zip`);

    for (const link of links) {
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

    processedInstruments += 1;
    console.log(`Ended ${instrumentDoc.name}`);
  }

  clearInterval(checkInterval);
  console.timeEnd('migration');
};
