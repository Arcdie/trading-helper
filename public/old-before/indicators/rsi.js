/* global RSI, LightweightCharts, constants */

const drawRSI = (chart, data, isNew = true) => {
  const localConstants = {
    period: 14,
    key: 'close',
  };

  const inputRSI = {
    values: data.map(candle => candle.close),
    period: localConstants.period,
  };

  const result = RSI.calculate(inputRSI);

  const outputData = [];

  data.forEach((candle, index) => {
    outputData.push({
      time: candle.time,
      value: result[index - localConstants.period],
    });
  });

  if (isNew) {
    const priceLineTom = chart.RSISeries.createPriceLine({
      price: 70,
      color: 'gray',
      lineWidth: 2,
      lineStyle: LightweightCharts.LineStyle.Dashed,
      axisLabelVisible: true,
    });

    const priceLineBottom = chart.RSISeries.createPriceLine({
      price: 30,
      color: 'gray',
      lineWidth: 2,
      lineStyle: LightweightCharts.LineStyle.Dashed,
      axisLabelVisible: true,
    });
  }

  chart.drawRSISeries(outputData);
};
