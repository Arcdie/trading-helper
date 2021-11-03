const ACTION_NAMES = new Map([
  ['newSpotInstrumentPrice', 'newSpotInstrumentPrice'],
  ['newFuturesInstrumentPrice', 'newFuturesInstrumentPrice'],

  ['newInstrumentVolumeBound', 'newInstrumentVolumeBound'],
  ['updateInstrumentVolumeBound', 'updateInstrumentVolumeBound'],
  ['deactivateInstrumentVolumeBound', 'deactivateInstrumentVolumeBound'],

  ['updateAverageVolume', 'updateAverageVolume'],

  ['candle5mData', 'candle5mData'],
  ['candle1hData', 'candle1hData'],
  ['candle4hData', 'candle4hData'],
  ['candle1dData', 'candle1dData'],
]);

const ACION_NAMES_CANDLE_DATA = [
  ACTION_NAMES.get('candle5mData'),
  ACTION_NAMES.get('candle1hData'),
  ACTION_NAMES.get('candle4hData'),
  ACTION_NAMES.get('candle1dData'),
];

module.exports = {
  ACTION_NAMES,
  ACION_NAMES_CANDLE_DATA,
};
