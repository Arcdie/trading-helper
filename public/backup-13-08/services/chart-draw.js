/* global
  LightweightCharts,
  chartCandles
*/

class ChartDraw {
  constructor() {
    this.settings = {};

    this.setSeries = [];
    this.setPriceLines = [];
  }

  addSeries({
    start,
    end,

    options,
  }) {
    options = options || {};

    options.priceLineSource = false;
    options.priceLineVisible = false;

    const newSeries = chartCandles.chart.addLineSeries(options);

    this.setSeries.push({
      start,
      end,
      series: newSeries,
    });

    ChartDraw.drawSeries(newSeries, [start, end]);

    return newSeries;
  }

  addPriceLine(value, isAddToHistory = false) {
    const insertObj = {
      value,
    };

    // if (isAddToHistory) {
    //   ChartDraw.addPriceLineToHistory(value);
    // }

    const resultDraw = this.drawPriceLine(value);
    insertObj.priceLine = resultDraw;

    this.setPriceLines.push(insertObj);
  }

  removePriceLine(index) {
    const priceLineFromSet = this.setPriceLines[index];

    chartCandles.series.removePriceLine(priceLineFromSet.priceLine);

    const setPriceLines = ChartDraw.getPriceLinesFromHistory();

    if (setPriceLines && setPriceLines.length) {
      setPriceLines.splice(index, 1);
      localStorage.setItem('setPriceLines', JSON.stringify(setPriceLines));
    }

    this.setPriceLines.splice(index, 1);
  }

  removeSeries(series) {
    chartCandles.chart.removeSeries(series);
  }

  static drawSeries(series, data) {
    series.setData(data);
  }

  drawPriceLine(value) {
    return chartCandles.series.createPriceLine({
      price: value,
      color: 'black',
      lineWidth: 1,
      lineStyle: LightweightCharts.LineStyle.Solid,
    });
  }

  drawPriceLinesByHistory() {
    const setPriceLines = ChartDraw.getPriceLinesFromHistory();

    if (setPriceLines && setPriceLines.length) {
      setPriceLines.forEach(value => {
        this.addPriceLine(value, false);
      });
    }
  }

  static addPriceLineToHistory(newValue) {
    const setPriceLines = ChartDraw.getPriceLinesFromHistory();

    setPriceLines.push(newValue);
    localStorage.setItem('setPriceLines', JSON.stringify(setPriceLines));
  }

  static getPriceLinesFromHistory() {
    let setPriceLines = localStorage.getItem('setPriceLines');

    if (!setPriceLines) {
      setPriceLines = [];
    } else {
      setPriceLines = JSON.parse(setPriceLines);
    }

    return setPriceLines;
  }
}
