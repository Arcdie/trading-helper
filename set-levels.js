const fs = require('fs');
const util = require('util');
const path = require('path');
const moment = require('moment');

const xml2js = require('xml2js');

xml2js.parseStringPromise = util.promisify(xml2js.parseString);

require('./middlewares/utils/set-env');
require('./libs/mongodb');

const log = require('./libs/logger');

const {
  clientConf: {
    userId,
  },
} = require('./config');

const Instrument = require('./models/Instrument');
const UserLevelBound = require('./models/UserLevelBound');

const pathToRoot = path.parse(process.cwd()).root;
// const pathToSettingsFolder = path.join(__dirname, './files/MVS');
const pathToSettingsFolder = 'D:\\FSR Launcher\\SubApps\\CScalp\\Data\\MVS';


if (!fs.existsSync(pathToSettingsFolder)) {
  log.warn('Cant find settings folder');
  process.exit(1);
}

const filesNames = fs.readdirSync(pathToSettingsFolder);

const setLevels = async () => {
  const userLevelBounds = await UserLevelBound.find({
    user_id: userId,
    is_worked: false,
  }, {
    instrument_id: 1,
    price_original: 1,
    created_at: 1,
  }).exec();

  if (!userLevelBounds || !userLevelBounds.length) {
    log.info('No UserLevelBounds');
    return true;
  }

  const instrumentsIds = userLevelBounds.map(bound => bound.instrument_id.toString());

  const instrumentsDocs = await Instrument.find({
    _id: {
      // $in: ['6156deec4b6ed207ae8cad07'],
      $in: instrumentsIds,
    },

    is_active: true,
  }, {
    name_spot: 1,
  }).exec();

  instrumentsDocs.forEach(instrumentDoc => {
    const boundsWithInstrument = userLevelBounds.filter(bound =>
      bound.instrument_id.toString() === instrumentDoc._id.toString(),
    );

    let validString = '';

    boundsWithInstrument.forEach(bound => {
      const validDate = moment(bound.created_at).format('DD.MM.YYYY');
      validString += `${bound.price_original}/${validDate};`;
    });

    validString = validString.slice(0, -1);

    filesNames.forEach(async fileName => {
      if (!fileName.includes(instrumentDoc.name_spot)) {
        return true;
      }

      const fileContent = fs.readFileSync(`${pathToSettingsFolder}/${fileName}`, 'utf8');
      const parsedContent = await xml2js.parseStringPromise(fileContent);

      parsedContent.Settings.DOM[0].UserLevels[0].$.Value = validString;

      const builder = new xml2js.Builder();
      const xml = builder.buildObject(parsedContent);

      fs.writeFileSync(`${pathToSettingsFolder}/${fileName}`, xml);
    });
  });

  log.info('End of operation');
};

setLevels();
