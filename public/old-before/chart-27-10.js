/* global LightweightCharts */

class Chart {
  constructor({
    containerName,
    containerWidth,
    containerHeight,
  }) {
    this.containerDocument = document.getElementById(containerName);

    this.chart = LightweightCharts.createChart(document.getElementById(containerName), {
      width: containerWidth,
      height: containerHeight,
    });

    this.chart.applyOptions({
      layout: {
        backgroundColor: '#F6FDFF',
      },

      crosshair: {
        mode: 0,
      },

      rightPriceScale: {
        width: 60,
      },
    });

    // this.chart.timeScale().subscribeVisibleTimeRangeChange((e) => {
    //   console.log(e);
    // });

    this.addSeries();
  }

  drawMainSeries(data) {
    if (Array.isArray(data)) {
      this.mainSeries.setData(data);
    } else this.mainSeries.update(data);
  }

  drawRSISeries(data) {
    this.RSISeries.setData(data);
  }

  drawSMASeries(data) {
    this.SMASeries.setData(data);
  }

  drawVolumeSeries(data) {
    this.volumeSeries.setData(data);
  }

  addSeries() {
    this.mainSeries = this.chart.addCandlestickSeries({
      upColor: '#000FFF',
      downColor: 'rgba(0, 0, 0, 0)',
      borderDownColor: '#000FFF',
      wickColor: '#000000',
    });

    this.SMASeries = this.chart.addLineSeries({
      priceLineVisible: false,
      priceLineSource: false,
    });

    this.RSISeries = this.chart.addLineSeries({
      priceScaleId: 'rsi',

      color: '#8E1599',
      lineWidth: 1,

      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    this.volumeSeries = this.chart.addHistogramSeries({
      color: '#26a69a',

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

  clearChart() {
    this.chart.removeSeries(this.mainSeries);
    this.chart.removeSeries(this.RSISeries);
    this.chart.removeSeries(this.SMASeries);
    this.chart.removeSeries(this.volumeSeries);
  }
}
