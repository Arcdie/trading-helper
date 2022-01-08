const priceJumpsConstants = require('./priceJumps/constants');
const priceReboundsConstants = require('./priceRebounds/constants');

const spotVolumesConstants = require('./spotVolumes/constants');

const STRATEGIES = new Map([
  ['priceJumps', 'priceJumps'],
  ['priceRebounds', 'priceRebounds'],

  ['trendTrading', 'trendTrading'],

  ['spotVolumes', 'spotVolumes'],
  ['futuresVolumes', 'futuresVolumes'],
]);

module.exports = {
  STRATEGIES,

  PRICE_JUMPS_CONSTANTS: priceJumpsConstants,
  PRICE_REBOUNDS_CONSTANTS: priceReboundsConstants,

  SPOT_VOLUMES_CONSTANTS: spotVolumesConstants,
};
