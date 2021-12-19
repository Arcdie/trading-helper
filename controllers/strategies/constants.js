const priceJumpsConstants = require('./priceJumps/constants');
const spotVolumesConstants = require('./spotVolumes/constants');

const STRATEGIES = new Map([
  ['priceJumps', 'priceJumps'],
  ['spotVolumes', 'spotVolumes'],
  ['futuresVolumes', 'futuresVolumes'],
]);

module.exports = {
  STRATEGIES,

  PRICE_JUMPS_CONSTANTS: priceJumpsConstants,
  SPOT_VOLUMES_CONSTANTS: spotVolumesConstants,
};
