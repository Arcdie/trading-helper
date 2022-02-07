const TYPES_EXIT = new Map([
  ['AUTO', 'AUTO'],
  ['MANUAL', 'MANUAL'],
]);

const TYPES_TRADES = new Map([
  ['MARKET', 'MARKET'],
  ['LIMIT', 'LIMIT'],

  ['STOP', 'STOP'],
  ['STOP_MARKET', 'STOP_MARKET'],
]);

module.exports = {
  TYPES_EXIT,
  TYPES_TRADES,
};
