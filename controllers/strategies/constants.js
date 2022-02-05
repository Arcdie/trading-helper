const priceJumpsConstants = require('./priceJumps/constants');
const priceReboundsConstants = require('./priceRebounds/constants');
const priceRollbacksConstants = require('./priceRollbacks/constants');

const levelReboundsConstants = require('./levelRebounds/constants');

const spotVolumesConstants = require('./spotVolumes/constants');

const STRATEGIES = new Map([
  ['priceJumps', 'priceJumps'],
  ['priceRebounds', 'priceRebounds'],
  ['priceRollbacks', 'priceRollbacks'],

  ['btcPriceJumps', 'btcPriceJumps'],

  ['levelRebounds', 'levelRebounds'],

  ['trendTrading', 'trendTrading'],

  ['spotVolumes', 'spotVolumes'],
  ['futuresVolumes', 'futuresVolumes'],
]);

module.exports = {
  STRATEGIES,

  PRICE_JUMPS_CONSTANTS: priceJumpsConstants,
  PRICE_REBOUNDS_CONSTANTS: priceReboundsConstants,
  PRICE_ROLLBACKS_CONSTANTS: priceRollbacksConstants,

  LEVEL_REBOUNDS_CONSTANTS: levelReboundsConstants,

  SPOT_VOLUMES_CONSTANTS: spotVolumesConstants,
};
