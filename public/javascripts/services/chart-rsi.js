/* global LightweightCharts, RSI */

class ChartRSI {
  constructor() {
    this.containerName = 'chart-rsi';
    this.containerDocument = document.getElementById(this.containerName);

    this.settings = {
      period: 14,
    };

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

    this.series = this.chart.addLineSeries({
      color: '#8E1599',
      lineWidth: 1,

      autoscaleInfoProvider: () => ({
        priceRange: {
          minValue: 25,
          maxValue: 75,
        },
      }),
    });

    this.series.createPriceLine({
      price: 70,
      color: 'gray',
      lineWidth: 2,
      lineStyle: LightweightCharts.LineStyle.Dashed,
    });

    this.series.createPriceLine({
      price: 30,
      color: 'gray',
      lineWidth: 2,
      lineStyle: LightweightCharts.LineStyle.Dashed,
    });
  }

  calculateData(inputData) {
    const inputRSI = {
      values: inputData.map(candle => candle.close),
      period: this.settings.period,
    };

    const result = RSI.calculate(inputRSI);

    const outputData = [];

    inputData.forEach((candle, index) => {
      outputData.push({
        time: candle.time,
        value: result[index - this.settings.period],
      });
    });

    return outputData;
  }

  drawSeries(data) {
    if (Array.isArray(data)) {
      this.series.setData(data);
    } else this.series.update(data);
  }
}
