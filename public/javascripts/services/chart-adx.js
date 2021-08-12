/* global LightweightCharts, ADX */

class ChartADX {
  constructor(rootContainer) {
    this.containerName = 'chart-adx';
    this.appendChart(rootContainer);

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
    });

    this.seriesADX = this.chart.addLineSeries({
      color: '#311B92',
      lineWidth: 1,

      autoscaleInfoProvider: () => ({
        priceRange: {
          minValue: 40,
          maxValue: 20,
        },
      }),
    });

    this.seriesMDI = this.chart.addLineSeries({
      color: '#FF5252',
      lineWidth: 1,
    });

    this.seriesPDI = this.chart.addLineSeries({
      color: '#4CAF50',
      lineWidth: 1,
    });

    this.seriesADX.createPriceLine({
      price: 20,
      color: 'gray',
      lineWidth: 2,
      lineStyle: LightweightCharts.LineStyle.Dashed,
    });
  }

  appendChart(rootContainer) {
    rootContainer.insertAdjacentHTML('beforeend', `<div id="${this.containerName}"></div>`);
  }

  calculateData(inputData) {
    const inputADX = {
      close: [],
      high: [],
      low: [],
      open: [],
      period: this.settings.period,
    };

    inputData.forEach(data => {
      inputADX.close.push(data.close);
      inputADX.high.push(data.high);
      inputADX.low.push(data.low);
      inputADX.open.push(data.open);
    });

    const {
      result,
    } = new ADX(inputADX);

    const outputData = [];
    const differenceBetweenLengthsResultAndData = inputData.length - result.length;
    const targetInputData = inputData.slice(differenceBetweenLengthsResultAndData);

    for (let i = 0; i < differenceBetweenLengthsResultAndData; i += 1) {
      outputData.unshift({
        time: inputData[i].time,
        adx: 0,
        mdi: 0,
        pdi: 0,
      });
    }

    targetInputData.forEach((candle, index) => {
      outputData.push({
        time: candle.time,
        adx: result[index].adx,
        mdi: result[index].mdi,
        pdi: result[index].pdi,
      });
    });

    return outputData;
  }

  drawSeries(data) {
    if (Array.isArray(data)) {
      this.seriesADX.setData(data.map(i => ({
        time: i.time,
        value: i.adx,
      })));

      this.seriesMDI.setData(data.map(i => ({
        time: i.time,
        value: i.mdi,
      })));

      this.seriesPDI.setData(data.map(i => ({
        time: i.time,
        value: i.pdi,
      })));
    } else {
      this.series.update(data);
    }
  }
}
