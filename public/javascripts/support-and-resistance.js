/* global
  moment, LightweightCharts,
  chartCandles
*/

// $.JQuery

// Constants

// Functions

const drawSupportAndResistanceLines = (data) => {
  let volumes = data
    .map(data => ({
      low: data.low,
      high: data.high,
      volume: parseFloat(data.volume),
    }))
    .sort((a, b) => {
      if (a.volume < b.volume) {
        return 1;
      }

      if (a.volume > b.volume) {
        return -1;
      }

      return 0;
    });

  const sum = volumes
    .slice(0, 20)
    .reduce((i, { volume }) => i + volume, 0);

  const average = sum / 20;

  console.log('average', average);

  volumes = volumes.filter(({ volume }) => volume > average);

  volumes.forEach(({ low }) => {
    chartCandles.series.createPriceLine({
      price: low,
      color: 'black',
      lineWidth: 1,
      lineStyle: LightweightCharts.LineStyle.Solid,
    });
  });

  return volumes;
};
