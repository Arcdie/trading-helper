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
  }) {
    const newSeries = this.chart.addLineSeries({
      priceLineVisible: false,
      priceLineSource: false,
    });

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
