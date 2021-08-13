/* global
  LightweightCharts,
  ChartSMA,
  AVAILABLE_PERIODS
*/

class ChartMain {
  constructor({
    period,
    stockName,

    isActiveLongSMA,
    isActiveShortSMA,
  }) {
    this.containerDocument = document.getElementById(`${stockName}-${period}-candles`);

    this.settings = {};

    this.containerWidth = this.containerDocument.clientWidth;
    this.containerHeight = this.containerDocument.clientHeight;

    this.addChart();
    this.setPeriod(period);

    this.chartLongSMA = isActiveLongSMA ? new ChartSMA(this.chart, 50) : false;
    this.chartShortSMA = isActiveShortSMA ? new ChartSMA(this.chart, 20) : false;

    // this.area = isActiveArea ? new ChartArea(this.chart) : false;

    this.addSeries();

    this.markers = [];
  }

  setPeriod(newPeriod) {
    if (newPeriod === AVAILABLE_PERIODS.get('MINUTE')
      || newPeriod === AVAILABLE_PERIODS.get('HOUR')) {
      this.chart.applyOptions({
        timeScale: {
          timeVisible: true,
        },
      });
    } else {
      this.chart.applyOptions({
        timeScale: {
          timeVisible: false,
        },
      });
    }

    this.period = newPeriod;
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
