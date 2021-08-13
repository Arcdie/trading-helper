/* global
  moment,
  chartCandles
*/

class ChartPeriods {
  constructor() {
    this.originalData = [];

    this.period = '';

    this.minuteTimeFrameData = [];
    this.hourTimeFrameData = [];
    this.dayTimeFrameData = [];
    this.monthTimeFrameData = [];
  }

  getDataByPeriod(period) {
    let returnData = [];

    switch (period) {
      case 'minute': returnData = this.minuteTimeFrameData; break;
      case 'hour': returnData = this.hourTimeFrameData; break;
      case 'day': returnData = this.dayTimeFrameData; break;
      case 'month': returnData = this.monthTimeFrameData; break;
      default: throw new Error('Undefined period');
    }

    return returnData;
  }

  setPeriod(newPeriod) {
    const returnData = this.getDataByPeriod(newPeriod);

    if (newPeriod === 'minute'
      || newPeriod === 'hour') {
      chartCandles.chart.applyOptions({
        timeScale: {
          timeVisible: true,
        },
      });
    } else {
      chartCandles.chart.applyOptions({
        timeScale: {
          timeVisible: false,
        },
      });
    }

    this.period = newPeriod;

    return returnData;
  }

  setOriginalData(stocksData) {
    this.originalData = stocksData;

    this.minuteTimeFrameData = [];
    this.hourTimeFrameData = [];
    this.dayTimeFrameData = [];
    this.monthTimeFrameData = [];

    this.calculateMinuteTimeFrameData();
    this.calculateHourTimeFrameData();
    this.calculateDayTimeFrameData();
    this.calculateMonthTimeFrameData();
  }

  calculateMinuteTimeFrameData() {
    this.minuteTimeFrameData = this.originalData;
  }

  calculateHourTimeFrameData() {
    const breakdownByDay = [];
    const breakdownByHour = [];

    let insertArr = [];
    let currentDay = new Date(this.originalData[0].time * 1000).getDate();

    this.originalData.forEach(candle => {
      const candleDay = new Date(candle.time * 1000).getDate();

      if (candleDay !== currentDay) {
        breakdownByDay.push(insertArr);
        insertArr = [];
        currentDay = candleDay;
      }

      insertArr.push(candle);
    });

    breakdownByDay.push(insertArr);
    insertArr = [];

    breakdownByDay.forEach(dayCandles => {
      let currentHourUnix = dayCandles[0].time;
      let nextCurrentHourUnix = currentHourUnix + 3600;

      dayCandles.forEach(minuteCandle => {
        if (minuteCandle.time >= nextCurrentHourUnix) {
          breakdownByHour.push(insertArr);
          insertArr = [];
          currentHourUnix = nextCurrentHourUnix;
          nextCurrentHourUnix += 3600;
        }

        insertArr.push(minuteCandle);
      });

      breakdownByHour.push(insertArr);
      insertArr = [];
    });

    breakdownByHour.forEach(hourCandles => {
      const arrLength = hourCandles.length;

      const open = hourCandles[0].open;
      const close = hourCandles[arrLength - 1].close;
      const candleDate = new Date(hourCandles[0].time * 1000);

      let minLow = hourCandles[0].low;
      let maxHigh = hourCandles[0].high;

      hourCandles.forEach(minuteCandle => {
        if (minuteCandle.high > maxHigh) {
          maxHigh = minuteCandle.high;
        }

        if (minuteCandle.low < minLow) {
          minLow = minuteCandle.low;
        }
      });

      const momentDate = moment(candleDate);

      this.hourTimeFrameData.push({
        // date: momentDate,
        time: momentDate.unix(),

        open,
        close,
        high: maxHigh,
        low: minLow,
      });
    });
  }

  calculateDayTimeFrameData() {
    const breakdownByDay = [];

    let insertArr = [];
    let currentDay = new Date(this.originalData[0].time * 1000).getDate();

    this.originalData.forEach(candle => {
      const candleDay = new Date(candle.time * 1000).getDate();

      if (candleDay !== currentDay) {
        breakdownByDay.push(insertArr);
        insertArr = [];
        currentDay = candleDay;
      }

      insertArr.push(candle);
    });

    breakdownByDay.push(insertArr);

    breakdownByDay.forEach(dayCandles => {
      const arrLength = dayCandles.length;

      const open = dayCandles[0].open;
      const close = dayCandles[arrLength - 1].close;
      const candleDate = new Date(dayCandles[0].time * 1000);

      let minLow = dayCandles[0].low;
      let maxHigh = dayCandles[0].high;

      dayCandles.forEach(minuteCandle => {
        if (minuteCandle.high > maxHigh) {
          maxHigh = minuteCandle.high;
        }

        if (minuteCandle.low < minLow) {
          minLow = minuteCandle.low;
        }
      });

      const momentDate = moment(candleDate).startOf('day');

      this.dayTimeFrameData.push({
        // date: momentDate,
        time: momentDate.format('YYYY-MM-DD'),

        open,
        close,
        high: maxHigh,
        low: minLow,
      });
    });
  }

  calculateMonthTimeFrameData() {
    const breakdownByMonth = [];

    let insertArr = [];
    let currentMonth = new Date(this.originalData[0].time * 1000).getMonth();

    this.originalData.forEach(candle => {
      const candleMonth = new Date(candle.time * 1000).getMonth();

      if (candleMonth !== currentMonth) {
        breakdownByMonth.push(insertArr);
        insertArr = [];
        currentMonth = candleMonth;
      }

      insertArr.push(candle);
    });

    breakdownByMonth.push(insertArr);

    breakdownByMonth.forEach(monthCandles => {
      const arrLength = monthCandles.length;

      const open = monthCandles[0].open;
      const close = monthCandles[arrLength - 1].close;
      const candleDate = new Date(monthCandles[0].time * 1000);

      let minLow = monthCandles[0].low;
      let maxHigh = monthCandles[0].high;

      monthCandles.forEach(minuteCandle => {
        if (minuteCandle.high > maxHigh) {
          maxHigh = minuteCandle.high;
        }

        if (minuteCandle.low < minLow) {
          minLow = minuteCandle.low;
        }
      });

      const momentDate = moment(candleDate).startOf('day');

      this.monthTimeFrameData.push({
        // date: momentDate,
        time: momentDate.format('YYYY-MM-DD'),

        open,
        close,
        high: maxHigh,
        low: minLow,
      });
    });
  }
}
