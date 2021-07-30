/* global LightweightCharts */

class ChartCandles {
  constructor() {
    this.containerName = 'chart-candles';
    this.containerDocument = document.getElementById(this.containerName);

    this.settings = {};

    this.containerWidth = this.containerDocument.clientWidth;
    this.containerHeight = this.containerDocument.clientHeight;

    this.chart = LightweightCharts.createChart(this.containerDocument, {
      width: this.containerWidth,
      height: this.containerHeight,
    });

    this.chart.applyOptions({
      layout: {
        backgroundColor: '#F6FDFF',
      },

      crosshair: {
        mode: 0,
      },

      timeScale: {
        visible: false,
      },
    });

    this.series = this.chart.addCandlestickSeries({
      upColor: '#000FFF',
      downColor: 'rgba(0, 0, 0, 0)',
      borderDownColor: '#000FFF',
      wickColor: '#000000',
    });

    this.seriesPaint = this.chart.addLineSeries({
      lineWidth: 1,
      priceLineVisible: false,
      priceLineSource: false,
    });
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
