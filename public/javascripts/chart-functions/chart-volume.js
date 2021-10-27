/* global LightweightCharts */

class ChartVolume {
  constructor(rootContainer) {
    this.containerName = 'chart-volume';
    this.appendChart(rootContainer);

    this.containerDocument = document.getElementsByClassName(this.containerName)[0];

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
        secondsVisible: false,
      },

      // timeScale: {
      //   visible: false,
      // },
    });

    this.series = this.chart.addHistogramSeries({
      color: 'rgba(12, 50, 153, .5)',

      priceFormat: {
        type: 'volume',
      },
    });
  }

  appendChart(rootContainer) {
    rootContainer.insertAdjacentHTML('beforeend', `<div class="${this.containerName}"></div>`);
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
