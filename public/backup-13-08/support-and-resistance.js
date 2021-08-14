/* global
  moment, LightweightCharts,
  chartCandles, chartDraw,
  drawHorizontalLineHandler
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
    const doesExistWithThisValue = chartDraw.setPriceLines.some(
      ({ value }) => value === low,
    );

    if (!doesExistWithThisValue) {
      drawHorizontalLineHandler(low);
    }
  });

  return volumes;
};
