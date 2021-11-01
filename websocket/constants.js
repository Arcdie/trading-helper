const ACTION_NAMES = new Map([
  ['newInstrumentVolumeBound', 'newInstrumentVolumeBound'],
  ['updateInstrumentVolumeBound', 'updateInstrumentVolumeBound'],
  ['deactivateInstrumentVolumeBound', 'deactivateInstrumentVolumeBound'],
  ['newSpotInstrumentPrice', 'newSpotInstrumentPrice'],
  ['newFuturesInstrumentPrice', 'newFuturesInstrumentPrice'],
  ['updateAverageVolume', 'updateAverageVolume'],
  ['candleData', 'candleData'],
  // newLoadedLevels,
  // endOfLoadLevels,
]);

module.exports = {
  ACTION_NAMES,
};
