/* global LightweightCharts */

class ChartArea {
  constructor(chart) {
    this.chart = chart;

    this.settings = {};

    this.series = this.chart.addAreaSeries({
      topColor: 'rgba(33, 150, 243, 0.56)',
      bottomColor: 'rgba(33, 150, 243, 0.04)',
      lineColor: 'rgba(33, 150, 243, 1)',
      lineWidth: 2,

      visible: false,
    });
  }

  calculateData(inputData) {
    const outputData = inputData.map(data => ({
      time: data.time,
      value: data.close,
    }));

    return outputData;
  }

  drawSeries(data) {
    if (Array.isArray(data)) {
      this.series.setData(data);
    } else this.series.update(data);
  }

  hideSeries() {
    this.series.applyOptions({
      visible: false,
    });
  }

  showSeries() {
    this.series.applyOptions({
      visible: true,
    });
  }
}
