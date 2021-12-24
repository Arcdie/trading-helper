const TYPES_EXIT = new Map([
  ['CANCELED', 'CANCELED'],
  ['DEACTIVATED', 'DEACTIVATED'],
]);

const TYPES_TRADES = new Map([
  ['PRICE_JUMP', 'PRICE_JUMP'],
  ['PRICE_REBOUND', 'PRICE_REBOUND'],

  ['SPOT_VOLUME', 'SPOT_VOLUME'],
]);

module.exports = {
  TYPES_EXIT,
  TYPES_TRADES,
};
