/* global LightweightCharts */

class ChartVolume {
  constructor(rootContainer) {
    this.containerName = 'chart-volume';
    this.appendChart(rootContainer);

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

      // timeScale: {
      //   visible: false,
      // },
    });

    this.series = this.chart.addHistogramSeries({
      color: '#26A69A',

      priceFormat: {
        type: 'volume',
      },
    });
  }

  appendChart(rootContainer) {
    rootContainer.insertAdjacentHTML('beforeend', `<div id="${this.containerName}"></div>`);
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
