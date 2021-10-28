/* global LightweightCharts */

class ChartCandles {
  constructor(rootContainer) {
    this.containerName = 'chart-candles';
    this.appendChart(rootContainer);

    this.containerDocument = document.getElementsByClassName(this.containerName)[0];

    this.settings = {};

    this.containerWidth = this.containerDocument.clientWidth;
    this.containerHeight = this.containerDocument.clientHeight;

    this.addChart();
    this.addSeries();
    this.markers = [];
  }

  appendChart(rootContainer) {
    rootContainer.insertAdjacentHTML('beforeend', `<div class="${this.containerName}"></div>`);
  }

  drawSeries(data) {
    if (Array.isArray(data)) {
      this.series.setData(data);
    } else {
      this.series.update(data);
    }
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

  removeChart() {
    this.removeSeries();
    this.chart.remove();
  }

  addSeries() {
    this.series = this.chart.addCandlestickSeries({
      upColor: '#000FFF',
      downColor: 'rgba(0, 0, 0, 0)',
      borderDownColor: '#000FFF',
      wickColor: '#000000',
    });
  }

  removeSeries() {
    this.chart.removeSeries(this.series);
    this.series = false;
  }
}
