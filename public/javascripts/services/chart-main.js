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
    this.containerName = `${stockName}-${period}-candles`;
    this.containerDocument = document.getElementById(this.containerName);

    this.settings = {};

    this.containerWidth = this.containerDocument.clientWidth;
    this.containerHeight = this.containerDocument.clientHeight;

    this.addChart();
    this.setPeriod(period);

    this.chartLongSMA = isActiveLongSMA ? new ChartSMA(this.chart, 50) : false;
    this.chartShortSMA = isActiveShortSMA ? new ChartSMA(this.chart, 20) : false;

    // this.area = isActiveArea ? new ChartArea(this.chart) : false;

    this.addMainSeries();

    this.setSeries = [];
    this.setMarkers = [];
    this.setPriceLines = [];
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

  drawSeries(data, series = this.series) {
    if (Array.isArray(data)) {
      series.setData(data);
    } else series.update(data);
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
    this.series.setMarkers(this.setMarkers.map(marker => ({
      time: marker.time,
      color: marker.color,
      text: marker.text,
      position: 'aboveBar',
      shape: 'arrowDown',
    })));
  }

  drawPriceLine(value) {
    return this.series.createPriceLine({
      price: value,
      color: 'black',
      lineWidth: 1,
      lineStyle: LightweightCharts.LineStyle.Solid,
    });
  }

  addMarker(data) {
    this.setMarkers.push(data);
  }

  addPriceLine(value) {
    const insertObj = { value };

    const resultDraw = this.drawPriceLine(value);
    insertObj.priceLine = resultDraw;

    this.setPriceLines.push(insertObj);
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

      // priceScale: {
      //   position: 'none',
      // },
    });
  }

  addMainSeries() {
    this.series = this.chart.addCandlestickSeries({
      upColor: '#000FFF',
      downColor: 'rgba(0, 0, 0, 0)',
      borderDownColor: '#000FFF',
      wickColor: '#000000',
    });
  }

  addSeries({
    start,
    end,

    options,
  }) {
    options = options || {};

    options.priceLineSource = false;
    options.priceLineVisible = false;

    const newSeries = this.chart.addLineSeries(options);

    this.setSeries.push({
      start,
      end,
      series: newSeries,
    });

    this.drawSeries([start, end], newSeries);

    return newSeries;
  }

  removeSeries(series, isMainSeries = false) {
    if (isMainSeries) {
      this.series = false;
    }

    this.chart.removeSeries(series);
  }

  removePriceLine(value) {
    const priceLineFromSet = this.setPriceLines.find(
      priceLine => priceLine.value === value,
    );

    if (!priceLineFromSet) {
      return false;
    }

    this.series.removePriceLine(priceLineFromSet.priceLine);

    this.setPriceLines = this.setPriceLines.filter(
      priceLine => priceLine.value !== value,
    );
  }

  /* deprecated
  removeChart() {
    this.removeSeries();
    this.chart.remove();
  }
  */
}
