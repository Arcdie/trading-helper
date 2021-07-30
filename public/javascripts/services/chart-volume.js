/* global LightweightCharts */

class ChartVolume {
  constructor(chart) {
    this.chart = chart;

    this.settings = {};

    this.series = this.chart.addHistogramSeries({
      color: '#26A69A',

      priceFormat: {
        type: 'volume',
      },

      priceScaleId: 'volume',

      scaleMargins: {
        top: 0.9,
        bottom: 0,
      },
    });
  }

  drawSeries(data) {
    if (Array.isArray(data)) {
      this.series.setData(data.map(candle => ({
        time: candle.time,
        value: candle.volume,
      })));
    } else {
      this.series.update({
        time: data.time,
        value: data.volume,
      });
    }
  }
}
