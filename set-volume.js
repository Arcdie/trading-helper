const fs = require('fs');
const util = require('util');
const path = require('path');
const xml2js = require('xml2js');

xml2js.parseStringPromise = util.promisify(xml2js.parseString);

require('./middlewares/utils/set-env');
require('./libs/mongodb');

const log = require('./libs/logger');

const Candle = require('./models/Candle');
const InstrumentNew = require('./models/InstrumentNew');

const pathToRoot = path.parse(process.cwd()).root;
// const pathToSettingsFolder = path.join(__dirname, './files/MVS');
const pathToSettingsFolder = 'D:\\FSR Launcher\\SubApps\\CScalp\\Data\\MVS';

if (!fs.existsSync(pathToSettingsFolder)) {
  log.warn('Cant find settings folder');
  process.exit(1);
}

const filesNames = fs.readdirSync(pathToSettingsFolder);

const setVolume = async () => {
  const instrumentsDocs = await InstrumentNew.find({
    is_active: true,
  }).exec();

  for (const doc of instrumentsDocs) {
    const candlesDocs = await Candle
      .find({ instrument_id: doc._id }, { data: 1 })
      .sort({ time: -1 })
      .limit(1440)
      .exec();

    if (!candlesDocs || !candlesDocs.length) {
      log.warn(`No candles for ${doc.name}`);
      continue;
    }

    let maxVolume = candlesDocs[0].data[4];

    candlesDocs.forEach(candleDoc => {
      if (candleDoc.data[4] > maxVolume) {
        maxVolume = candleDoc.data[4];
      }
    });

    if (!maxVolume) {
      log.warn(`maxVolume = 0 for ${doc.name}`);
      continue;
    }

    const halfFromMaxVolume = Math.ceil(maxVolume / 2);

    let docName = doc.name;
    const isFutures = doc.is_futures;

    if (isFutures) {
      docName = docName.replace('PERP', '');
    }

    filesNames.forEach(async fileName => {
      if (!fileName.includes(docName)) {
        return true;
      }

      if (isFutures) {
        if (!fileName.includes(`CCUR_FUT.${docName}`)) {
          return true;
        }
      } else {
        if (!fileName.includes(`CCUR.${docName}`)) {
          return true;
        }
      }

      const fileContent = fs.readFileSync(`${pathToSettingsFolder}/${fileName}`, 'utf8');
      const parsedContent = await xml2js.parseStringPromise(fileContent);

      parsedContent.Settings.DOM[0].FilledAt[0].$.Value = halfFromMaxVolume.toString();
      parsedContent.Settings.DOM[0].BigAmount[0].$.Value = halfFromMaxVolume.toString();
      parsedContent.Settings.DOM[0].HugeAmount[0].$.Value = maxVolume.toString();

      parsedContent.Settings.CLUSTER_PANEL[0].FilledAt[0].$.Value = maxVolume.toString();

      const builder = new xml2js.Builder();
      const xml = builder.buildObject(parsedContent);
      fs.writeFileSync(`${pathToSettingsFolder}/${fileName}`, xml);
    });

    log.info(`Ended ${doc.name}`);
  }

  log.info('Finished');
};

setVolume();
