/* global
  LightweightCharts,
  ChartSMA, ChartArea
  */

class ChartMain {
  constructor({
    period,
    rootContainer,

    isActiveArea,
    isActiveLongSMA,
    isActiveShortSMA,
  }) {
    this.containerName = `chart-candles-${period}`;
    this.appendChart(rootContainer);

    this.containerDocument = document.getElementById(this.containerName);

    this.settings = {};

    this.containerWidth = this.containerDocument.clientWidth;
    this.containerHeight = this.containerDocument.clientHeight;

    this.addChart();

    this.area = isActiveArea ? new ChartArea(this.chart) : false;
    this.longSMA = isActiveLongSMA ? new ChartSMA(this.chart, 50) : false;
    this.shortSMA = isActiveShortSMA ? new ChartSMA(this.chart, 20) : false;

    this.addSeries();

    this.markers = [];
  }

  appendChart(rootContainer) {
    rootContainer.insertAdjacentHTML('beforeend', `<div id="${this.containerName}"></div>`);
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

  drawMarkers() {
    this.series.setMarkers(this.markers.map(marker => ({
      time: marker.time,
      color: marker.color,
      text: marker.text,
      position: 'aboveBar',
      shape: 'arrowDown',
    })));
  }

  addMarker(data) {
    this.markers.push(data);
  }

  addChart() {
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
        secondsVisible: false,
      },
    });
  }

  addSeries() {
    this.series = this.chart.addCandlestickSeries({
      upColor: '#000FFF',
      downColor: 'rgba(0, 0, 0, 0)',
      borderDownColor: '#000FFF',
      wickColor: '#000000',
    });
  }

  removeChart() {
    this.removeSeries();
    this.chart.remove();
  }

  removeSeries() {
    this.chart.removeSeries(this.series);
    this.series = false;
  }
}
