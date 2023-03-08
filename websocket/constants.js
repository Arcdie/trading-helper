const ACTION_NAMES = new Map([
  ['nextTick', 'nextTick'],

  ['newSpotInstrumentPrice', 'newSpotInstrumentPrice'],
  ['newFuturesInstrumentPrice', 'newFuturesInstrumentPrice'],

  ['newInstrumentVolumeBound', 'newInstrumentVolumeBound'],
  ['updateInstrumentVolumeBound', 'updateInstrumentVolumeBound'],
  ['deactivateInstrumentVolumeBound', 'deactivateInstrumentVolumeBound'],

  ['updateAverageVolume', 'updateAverageVolume'],

  ['spotLimitOrders', 'spotLimitOrders'],
  ['spotCandle1mData', 'spotCandle1mData'],
  ['spotCandle5mData', 'spotCandle5mData'],
  ['spotCandle1hData', 'spotCandle1hData'],
  ['spotCandle4hData', 'spotCandle4hData'],
  ['spotCandle1dData', 'spotCandle1dData'],

  ['futuresLimitOrders', 'futuresLimitOrders'],
  ['futuresCandle1mData', 'futuresCandle1mData'],
  ['futuresCandle5mData', 'futuresCandle5mData'],
  ['futuresCandle1hData', 'futuresCandle1hData'],
  ['futuresCandle4hData', 'futuresCandle4hData'],
  ['futuresCandle1dData', 'futuresCandle1dData'],
]);

const PRIVATE_ACTION_NAMES = new Map([
  ['levelsLoaded', 'levelsLoaded'],
  ['userLevelBoundsCreated', 'userLevelBoundsCreated'],
  ['levelWasWorked', 'levelWasWorked'],
]);

const ACION_NAMES_CANDLE_DATA = [
  ACTION_NAMES.get('spotCandle1mData'),
  ACTION_NAMES.get('spotCandle5mData'),
  ACTION_NAMES.get('spotCandle1hData'),
  ACTION_NAMES.get('spotCandle4hData'),
  ACTION_NAMES.get('spotCandle1dData'),

  ACTION_NAMES.get('futuresCandle1mData'),
  ACTION_NAMES.get('futuresCandle5mData'),
  ACTION_NAMES.get('futuresCandle1hData'),
  ACTION_NAMES.get('futuresCandle4hData'),
  ACTION_NAMES.get('futuresCandle1dData'),
];

module.exports = {
  ACTION_NAMES,
  PRIVATE_ACTION_NAMES,
  ACION_NAMES_CANDLE_DATA,
};
