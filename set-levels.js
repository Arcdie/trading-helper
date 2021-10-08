const fs = require('fs');
const path = require('path');

require('./libs/mongodb');

const log = require('./libs/logger');

const {
  clientConf: {
    userId,
  },
} = require('./config');

const Instrument = require('./models/Instrument');
const UserLevelBound = require('./models/Instrument');

const pathToRoot = path.parse(process.cwd()).root;
const pathToSettingsFolder = `${pathToRoot}Program Files (x86)\\FSR Launcher\\SubApps\\CScalp\\Data\\MVS`;

if (!fs.existsSync(pathToSettingsFolder)) {
  log.warn('Cant find settings folder');
  process.exit(1);
}

const updateLevelsInCScalp = async () => {
  const userLevelBounds = await UserLevelBound.find({
    user_id: userId,
    is_worked: false,
  }, {
    instrument_id: 1,
    price_original: 1,
  }).exec();

  const instrumentsDocs = await Instrument.find({
    is_active: true,
  },
  {}).exec()
};

updateLevelsInCScalp();
