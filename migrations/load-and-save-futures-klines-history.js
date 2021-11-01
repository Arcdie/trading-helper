const fs = require('fs');
const path = require('path');
const util = require('util');
const axios = require('axios');
const xml2js = require('xml2js');
const AdmZip = require('adm-zip');

const {
  parseCSVToJSON,
} = require('../controllers/files/utils/parse-csv-to-json');

const {
  create5mCandle,
} = require('../controllers/candles/utils/create-5m-candle');

const log = require('../libs/logger');

const InstrumentNew = require('../models/InstrumentNew');

const LOAD_PERIOD = '5m';

xml2js.parseStringPromise = util.promisify(xml2js.parseString);

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  const instrumentsDocs = await InstrumentNew.find({
    name: 'IOTXUSDTPERP',

    is_active: true,
    is_futures: true,
  }).exec();

  if (!instrumentsDocs || !instrumentsDocs.length) {
    console.timeEnd('migration');
    return true;
  }

  for (const instrumentDoc of instrumentsDocs) {
    console.log(`Started ${instrumentDoc.name}`);

    const instrumentName = instrumentDoc.name.replace('PERP', '');

    const pathToFolder = path.join(__dirname, `../files/klines/monthly/${instrumentDoc.name}`);

    if (!fs.existsSync(pathToFolder)) {
      fs.mkdirSync(pathToFolder);
    }

    const responseGetPage = await axios({
      method: 'get',
      url: `https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/futures/um/monthly/klines/${instrumentName}/${LOAD_PERIOD}/`,
    });

    const links = [];
    const parsedXml = await xml2js.parseStringPromise(responseGetPage.data);

    parsedXml.ListBucketResult.Contents.forEach(content => {
      const {
        Key,
        LastModified,
      } = content;

      if (!Key[0].includes('CHECKSUM')) {
        links.push({
          link: Key[0],
          date: new Date(LastModified[0]),
        });
      }
    });

    console.log(`${instrumentDoc.name}: ${links.length} files`);

    for (const link of links) {
      console.log(`${instrumentDoc.name}: started load file ${link.link}`);

      const resultGetFile = await axios({
        method: 'get',
        url: `https://data.binance.vision/${link.link}`,
        responseType: 'arraybuffer',
      });

      const zip = new AdmZip(resultGetFile.data);
      zip.extractAllTo(pathToFolder, true);
    }

    const filesNames = [];

    fs
      .readdirSync(pathToFolder)
      .forEach(fileName => {
        filesNames.push(fileName);
      });

    for (const fileName of filesNames) {
      const pathToFile = `${pathToFolder}/${fileName}`;
      const period = pathToFile.split('-')[1];

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

        const resultCreateCandle = await create5mCandle({
          instrumentId: instrumentDoc._id,
          startTime: new Date(parseInt(openTime, 10)),
          open,
          close,
          high,
          low,
          volume,
        });

        if (!resultCreateCandle || !resultCreateCandle.status) {
          log.warn(resultCreateCandle.message || 'Cant create5mCandle');
        }
      }));
    }

    console.log(`Ended ${instrumentDoc.name}`);
  }

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
