/* global */

/* Constants */
const PERIOD_FOR_LONG_SMA = 200;
const PERIOD_FOR_MEDIUM_SMA = 50;
const PERIOD_FOR_SHORT_SMA = 20;

class ChartSMA {
  constructor(chart, period) {
    this.chart = chart;
    this.period = period;

    let color;

    if (period >= PERIOD_FOR_LONG_SMA) {
      color = '#0800ff';
    } else if (period >= PERIOD_FOR_MEDIUM_SMA) {
      color = '#2196F3';
    } else {
      color = '#311B92';
    }

    this.series = this.chart.addLineSeries({
      priceLineVisible: false,
      priceLineSource: false,
      color,
      lineWidth: 2,
    });
  }

  calculateData(inputData) {
    const usingData = [];
    const outputData = [];

    inputData.forEach((candle, index) => {
      usingData.push(candle.close);

      const currentData = usingData.slice(index - (this.period - 1));
      const sum = currentData.reduce((i, close) => i + close, 0);
      const average = sum / currentData.length;

      // if (usingData.length < this.period) {
      //   return true;
      // }

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
