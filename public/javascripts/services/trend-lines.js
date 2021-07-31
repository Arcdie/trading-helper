/* global */

class TrendLines {
  constructor(chart) {
    this.chart = chart;

    this.settings = {};

    this.setSeries = [];
  }

  addSeries({
    start,
    end,

    options,
  }) {
    options = options || {};

    options.priceLineSource = false;
    options.priceLineVisible = false;

    const newSeries = this.chart.addLineSeries(options);

    this.setSeries.push({
      start,
      end,
      series: newSeries,
    });

    TrendLines.drawSeries(newSeries, [start, end]);
  }

  removeSeries(series) {
    this.chart.removeSeries(series);
  }

  static drawSeries(series, data) {
    series.setData(data);
  }
}
