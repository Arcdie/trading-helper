/* global moment, chartCandles */

class ChartPeriods {
  constructor() {
    this.originalData = [];

    this.period = '';

    this.oneMinuteTimeFrameData = [];
    this.fiveMinutesTimeFrameData = [];
    this.oneHourTimeFrameData = [];
    this.fourHoursTimeFrameData = [];
    this.dayTimeFrameData = [];
    this.monthTimeFrameData = [];
  }

  getDataByPeriod(period) {
    let returnData = [];

    switch (period) {
      case '1m': returnData = this.oneMinuteTimeFrameData; break;
      case '5m': returnData = this.fiveMinutesTimeFrameData; break;
      case '1h': returnData = this.oneHourTimeFrameData; break;
      case '4h': returnData = this.fourHoursTimeFrameData; break;
      case 'day': returnData = this.dayTimeFrameData; break;
      case 'month': returnData = this.monthTimeFrameData; break;
      default: throw new Error('Undefined period');
    }

    return returnData;
  }

  setPeriod(newPeriod, charts) {
    const returnData = this.getDataByPeriod(newPeriod);

    if (['1m', '5m', '1h', '4h'].includes(newPeriod)) {
      charts.forEach(chart => {
        chart.applyOptions({
          timeScale: {
            timeVisible: true,
          },
        });
      });
    } else {
      charts.forEach(chart => {
        chart.applyOptions({
          timeScale: {
            timeVisible: false,
          },
        });
      });
    }

    this.period = newPeriod;

    return returnData;
  }

  // remove startPeriod after collect minutes candles
  setOriginalData(instrumentData, startPeriod) {
    this.originalData = instrumentData.map(data => {
      const timeUnix = parseInt(new Date(data.time).getTime() / 1000, 10);

      return {
        timeUnix,
        time: data.time,

        open: data.data[0],
        close: data.data[1],
        low: data.data[2],
        high: data.data[3],
        volume: data.volume,
      };
    });

    this.oneMinuteTimeFrameData = [];
    this.fiveMinutesTimeFrameData = [];
    this.oneHourTimeFrameData = [];
    this.fourHoursTimeFrameData = [];
    this.dayTimeFrameData = [];
    this.monthTimeFrameData = [];

    if (startPeriod === '1h') {
      // tmo solution
      this.oneHourTimeFrameData = this.originalData.map(data => {
        const returnObj = data;
        returnObj.time = data.timeUnix;
        return returnObj;
      });
    } else {
      console.log('HERE');
      this.calculateOneHourTimeFrameData();
    }

    this.calculateOneMinuteTimeFrameData();
    this.calculateFiveMinutesTimeFrameData();
    this.calculateFourHoursTimeFrameData();
    this.calculateDayTimeFrameData();
    this.calculateMonthTimeFrameData();
  }

  calculateOneMinuteTimeFrameData() {
    this.oneMinuteTimeFrameData = this.originalData.map(data => {
      data.time = data.timeUnix;
      return data;
    });
  }

  calculateFiveMinutesTimeFrameData() {
    const breakdownBy5MinutePeriods = [];

    let insertArr = [];
    let currentMinutes = new Date(this.originalData[0].time).getMinutes();

    this.originalData.forEach(candle => {
      const candleMinutes = new Date(candle.time).getMinutes();
      const remainder = candleMinutes % 5;

      if (remainder === 0) {
        if (insertArr.length) {
          breakdownBy5MinutePeriods.push(insertArr);
          insertArr = [];
          currentMinutes = candleMinutes;
        }
      }

      insertArr.push(candle);
    });

    breakdownBy5MinutePeriods.forEach(fiveMinutesCandles => {
      const arrLength = fiveMinutesCandles.length;

      const open = fiveMinutesCandles[0].open;
      const close = fiveMinutesCandles[arrLength - 1].close;

      let sumVolume = 0;
      let minLow = fiveMinutesCandles[0].low;
      let maxHigh = fiveMinutesCandles[0].high;

      fiveMinutesCandles.forEach(minuteCandle => {
        if (minuteCandle.high > maxHigh) {
          maxHigh = minuteCandle.high;
        }

        if (minuteCandle.low < minLow) {
          minLow = minuteCandle.low;
        }

        sumVolume += minuteCandle.volume;
      });

      this.fiveMinutesTimeFrameData.push({
        // date: momentDate,
        time: fiveMinutesCandles[0].timeUnix,

        open,
        close,
        high: maxHigh,
        low: minLow,
        volume: parseInt(sumVolume, 10),
      });
    });
  }

  calculateOneHourTimeFrameData() {
    const breakdownByDay = [];
    const breakdownByHour = [];

    let insertArr = [];
    let currentDay = new Date(this.originalData[0].timeUnix * 1000).getDate();

    this.originalData.forEach(candle => {
      const candleDay = new Date(candle.timeUnix * 1000).getDate();

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
      let currentHourUnix = dayCandles[0].timeUnix;
      let nextCurrentHourUnix = currentHourUnix + 3600;

      dayCandles.forEach(minuteCandle => {
        if (minuteCandle.timeUnix >= nextCurrentHourUnix) {
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

      let sumVolume = 0;
      let minLow = hourCandles[0].low;
      let maxHigh = hourCandles[0].high;

      hourCandles.forEach(minuteCandle => {
        if (minuteCandle.high > maxHigh) {
          maxHigh = minuteCandle.high;
        }

        if (minuteCandle.low < minLow) {
          minLow = minuteCandle.low;
        }

        sumVolume += minuteCandle.volume;
      });

      this.oneHourTimeFrameData.push({
        // date: momentDate,
        time: hourCandles[0].timeUnix,

        open,
        close,
        high: maxHigh,
        low: minLow,
        volume: parseInt(sumVolume, 10),
      });
    });
  }

  calculateFourHoursTimeFrameData() {
    const breakdownByDay = [];
    const breakdownByHour = [];

    let insertArr = [];
    let currentDay = new Date(this.originalData[0].timeUnix * 1000).getDate();

    this.originalData.forEach(candle => {
      const candleDay = new Date(candle.timeUnix * 1000).getDate();

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
      let currentHourUnix = dayCandles[0].timeUnix;
      let nextCurrentHourUnix = currentHourUnix + (3600 * 4);

      dayCandles.forEach(minuteCandle => {
        if (minuteCandle.timeUnix >= nextCurrentHourUnix) {
          breakdownByHour.push(insertArr);
          insertArr = [];
          currentHourUnix = nextCurrentHourUnix;
          nextCurrentHourUnix += (3600 * 4);
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

      let sumVolume = 0;
      let minLow = hourCandles[0].low;
      let maxHigh = hourCandles[0].high;

      hourCandles.forEach(minuteCandle => {
        if (minuteCandle.high > maxHigh) {
          maxHigh = minuteCandle.high;
        }

        if (minuteCandle.low < minLow) {
          minLow = minuteCandle.low;
        }

        sumVolume += minuteCandle.volume;
      });

      this.fourHoursTimeFrameData.push({
        // date: momentDate,
        time: hourCandles[0].timeUnix,

        open,
        close,
        high: maxHigh,
        low: minLow,
        volume: parseInt(sumVolume, 10),
      });
    });
  }

  calculateDayTimeFrameData() {
    const breakdownByDay = [];

    let insertArr = [];
    let currentDay = new Date(this.originalData[0].timeUnix * 1000).getDate();

    this.originalData.forEach(candle => {
      const candleDay = new Date(candle.timeUnix * 1000).getDate();

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
      const candleDate = new Date(dayCandles[0].timeUnix * 1000);

      let sumVolume = 0;
      let minLow = dayCandles[0].low;
      let maxHigh = dayCandles[0].high;

      dayCandles.forEach(minuteCandle => {
        if (minuteCandle.high > maxHigh) {
          maxHigh = minuteCandle.high;
        }

        if (minuteCandle.low < minLow) {
          minLow = minuteCandle.low;
        }

        sumVolume += minuteCandle.volume;
      });

      const momentDate = moment(candleDate).startOf('day');

      this.dayTimeFrameData.push({
        // date: momentDate,
        time: momentDate.format('YYYY-MM-DD'),

        open,
        close,
        high: maxHigh,
        low: minLow,
        volume: parseInt(sumVolume, 10),
      });
    });
  }

  calculateMonthTimeFrameData() {
    const breakdownByMonth = [];

    let insertArr = [];
    let currentMonth = new Date(this.originalData[0].timeUnix * 1000).getMonth();

    this.originalData.forEach(candle => {
      const candleMonth = new Date(candle.timeUnix * 1000).getMonth();

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
      const candleDate = new Date(monthCandles[0].timeUnix * 1000);

      let sumVolume = 0;
      let minLow = monthCandles[0].low;
      let maxHigh = monthCandles[0].high;

      monthCandles.forEach(minuteCandle => {
        if (minuteCandle.high > maxHigh) {
          maxHigh = minuteCandle.high;
        }

        if (minuteCandle.low < minLow) {
          minLow = minuteCandle.low;
        }

        sumVolume += minuteCandle.volume;
      });

      const momentDate = moment(candleDate).startOf('day');

      this.monthTimeFrameData.push({
        // date: momentDate,
        time: momentDate.format('YYYY-MM-DD'),

        open,
        close,
        high: maxHigh,
        low: minLow,
        volume: parseInt(sumVolume, 10),
      });
    });
  }
}
