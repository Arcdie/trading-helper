const drawVolume = (chart, data) => {
  const constants = {};

  chart.drawVolumeSeries(data.map(candle => ({
    time: candle.time,
    value: candle.volume,
    color: 'rgba(0, 150, 136, 0.8)',
  })));
};
