/* global LightweightCharts */

class ChartSMA {
  constructor(chart) {
    this.chart = chart;

    this.settings = {
      period: 50,
    };

    this.series = this.chart.addLineSeries({
      priceLineVisible: false,
      priceLineSource: false,
    });
  }

  calculateData(inputData) {
    const usingData = [];
    const outputData = [];

    inputData.forEach((candle, index) => {
      usingData.push(candle.close);

      const currentData = usingData.slice(index - (this.settings.period - 1));
      const sum = currentData.reduce((i, close) => i + close, 0);
      const average = sum / currentData.length;

      outputData.push({
        time: candle.time,
        value: average,
      });
    });

    return outputData;
  }

  drawSeries(data) {
    if (Array.isArray(data)) {
      this.series.setData(data);
    } else this.series.update(data);
  }
}
