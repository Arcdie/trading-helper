const fs = require('fs');
const path = require('path');
const axios = require('axios');
const moment = require('moment');
const AdmZip = require('adm-zip');

const log = require('../../../libs/logger')(module);

const {
  getUnix,
} = require('../../../libs/support');

const {
  create5mCandles,
} = require('../utils/create-5m-candles');

const {
  parseCSVToJSON,
} = require('../../files/utils/parse-csv-to-json');

const {
  getActiveInstruments,
} = require('../../instruments/utils/get-active-instruments');

const Candle5m = require('../../../models/Candle-5m');

module.exports = async (req, res, next) => {
  try {
    res.json({
      status: true,
    });

    const resultGetInstruments = await getActiveInstruments({
      isOnlyFutures: true, // tmp
    });

    if (!resultGetInstruments || !resultGetInstruments.status) {
      log.warn(resultGetInstruments.message || 'Cant getActiveInstruments');
      return false;
    }

    if (!resultGetInstruments.result || !resultGetInstruments.result.length) {
      return true;
    }

    const startDate = moment().utc().startOf('day').add(-1, 'days');
    const startDateUnix = moment(startDate).unix();

    const instrumentsDocs = resultGetInstruments.result;

    for await (const instrumentDoc of instrumentsDocs) {
      const candles5mDocs = await Candle5m.find({
        instrument_id: instrumentDoc._id,

        time: { $lt: startDate },
      }, { time: 1 }).sort({ time: 1 }).exec();

      if (!candles5mDocs.length) {
        continue;
      }

      let datesToDownload = [];
      const candlesTimeToCreate = [];
      let nextTimeUnix = getUnix(candles5mDocs[0].time);

      while (nextTimeUnix !== startDateUnix) {
        const candleDoc = candles5mDocs[0];
        const candleTimeUnix = getUnix(candleDoc.time);

        if (nextTimeUnix !== candleTimeUnix) {
          candlesTimeToCreate.push(nextTimeUnix);
        } else {
          candles5mDocs.shift();
        }

        nextTimeUnix += 300;
      }

      if (!candlesTimeToCreate.length) {
        continue;
      }

      candlesTimeToCreate.forEach(timeUnix => {
        const startOfDay = moment.unix(timeUnix).utc().startOf('day');
        const startOfDayUnix = moment(startOfDay).unix();

        const doesExistDateToDownload = datesToDownload.some(
          date => date.startOfDayUnix === startOfDayUnix,
        );

        if (!doesExistDateToDownload) {
          datesToDownload.push({
            startOfDay,
            startOfDayUnix,
            day: startOfDay.format('DD'),
            month: startOfDay.format('MM'),
            year: startOfDay.format('YYYY'),
          });
        }
      });

      let typeInstrument = 'spot';
      let instrumentName = instrumentDoc.name;

      if (instrumentDoc.is_futures) {
        typeInstrument = 'futures/um';
        instrumentName = instrumentDoc.name.replace('PERP', '');
      }

      const pathToFolder = path.join(__dirname, `../../../files/klines/daily/5m/${instrumentDoc.name}`);

      if (!fs.existsSync(pathToFolder)) {
        fs.mkdirSync(pathToFolder);
      }

      const links = datesToDownload.map(date => ({
        startOfDayUnix: date.startOfDayUnix,
        link: `data/${typeInstrument}/daily/klines/${instrumentName}/5m/${instrumentName}-5m-${date.year}-${date.month}-${date.day}.zip`,
      }));

      for await (const link of links) {
        try {
          const resultGetFile = await axios({
            method: 'get',
            url: `https://data.binance.vision/${link.link}`,
            responseType: 'arraybuffer',
          });

          const zip = new AdmZip(resultGetFile.data);
          zip.extractAllTo(pathToFolder, true);
        } catch (error) {
          log.warn(`${link.link}, ${error.message}`);

          datesToDownload = datesToDownload.filter(
            date => date.startOfDayUnix !== link.startOfDayUnix,
          );
        }
      }

      if (!datesToDownload.length) {
        continue;
      }

      const filesNames = [];

      fs
        .readdirSync(pathToFolder)
        .forEach(fileName => {
          filesNames.push(fileName);
        });

      for await (const fileName of filesNames) {
        const pathToFile = `${pathToFolder}/${fileName}`;

        const resultGetFile = await parseCSVToJSON({
          pathToFile,
        });

        if (!resultGetFile || !resultGetFile.status) {
          log.warn(resultGetFile.message || 'Cant parseCSVToJSON');
          continue;
        }

        const newCandles = [];

        resultGetFile.result.forEach(data => {
          const dataTimeUnix = parseInt(data[0] / 1000, 10);
          const doesExistTimeInCandlesToCreate = candlesTimeToCreate.includes(dataTimeUnix);

          if (doesExistTimeInCandlesToCreate) {
            const [
              openTime,
              open,
              high,
              low,
              close,
              volume,
              // closeTime,
            ] = data;

            newCandles.push({
              instrumentId: instrumentDoc._id,
              startTime: new Date(parseInt(openTime, 10)),
              open,
              close,
              high,
              low,
              volume,
            });
          }
        });

        if (newCandles.length) {
          const resultCreateCandles = await create5mCandles({
            isFutures: instrumentDoc.is_futures,
            newCandles,
          });

          if (!resultCreateCandles || !resultCreateCandles.status) {
            log.warn(resultCreateCandles.message || 'Cant create5mCandles');
          }
        }
      }

      removeFolder(pathToFolder);
    }
  } catch (error) {
    log.warn(error.message);
    return false;
  }
};

const removeFolder = path => {
  fs.readdirSync(path).forEach(file => {
    const curPath = `${path}/${file}`;
    if (fs.lstatSync(curPath).isDirectory()) {
      removeFolder(curPath);
    } else {
      fs.unlinkSync(curPath);
    }
  });

  fs.rmdirSync(path);
};

const calculateOneHourTimeFrameData = (candles) => {
  const breakdownByDay = [];
  const breakdownByHour = [];

  let insertArr = [];
  let currentDay = new Date(candles[0].time).getUTCDate();

  candles.forEach(candle => {
    const candleDay = new Date(candle.time).getUTCDate();

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
    let currentHourUnix = getUnix(dayCandles[0].time);
    let nextCurrentHourUnix = currentHourUnix + 3600;

    dayCandles.forEach(candle => {
      if (getUnix(candle.time) >= nextCurrentHourUnix) {
        breakdownByHour.push(insertArr);
        insertArr = [];
        currentHourUnix = nextCurrentHourUnix;
        nextCurrentHourUnix += 3600;
      }

      insertArr.push(candle);
    });

    breakdownByHour.push(insertArr);
    insertArr = [];
  });

  const returnData = [];

  breakdownByHour.forEach(hourCandles => {
    const arrLength = hourCandles.length;

    const open = hourCandles[0].open;
    const close = hourCandles[arrLength - 1].close;
    const candleDate = hourCandles[0].time;

    let sumVolume = 0;
    let minLow = hourCandles[0].low;
    let maxHigh = hourCandles[0].high;

    hourCandles.forEach(candle => {
      if (candle.high > maxHigh) {
        maxHigh = candle.high;
      }

      if (candle.low < minLow) {
        minLow = candle.low;
      }

      sumVolume += candle.volume;
    });

    returnData.push({
      open,
      close,
      high: maxHigh,
      low: minLow,
      volume: parseInt(sumVolume, 10),
      time: moment(candleDate).utc().startOf('hour'),
    });
  });

  return returnData;
};

const calculateFourHoursTimeFrameData = (candles) => {
  const breakdownByDay = [];
  const breakdownByHour = [];

  let insertArr = [];
  let currentDay = new Date(candles[0].time).getUTCDate();

  candles.forEach(candle => {
    const candleDay = new Date(candle.time).getUTCDate();

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
    let currentHourUnix = getUnix(dayCandles[0].time);
    let nextCurrentHourUnix = currentHourUnix + (3600 * 4);

    dayCandles.forEach(candle => {
      if (getUnix(candle.time) >= nextCurrentHourUnix) {
        breakdownByHour.push(insertArr);
        insertArr = [];
        currentHourUnix = nextCurrentHourUnix;
        nextCurrentHourUnix += (3600 * 4);
      }

      insertArr.push(candle);
    });

    breakdownByHour.push(insertArr);
    insertArr = [];
  });

  const returnData = [];

  breakdownByHour.forEach(hourCandles => {
    const arrLength = hourCandles.length;

    const open = hourCandles[0].open;
    const close = hourCandles[arrLength - 1].close;
    const candleDate = hourCandles[0].time;

    let sumVolume = 0;
    let minLow = hourCandles[0].low;
    let maxHigh = hourCandles[0].high;

    hourCandles.forEach(candle => {
      if (candle.high > maxHigh) {
        maxHigh = candle.high;
      }

      if (candle.low < minLow) {
        minLow = candle.low;
      }

      sumVolume += candle.volume;
    });

    returnData.push({
      open,
      close,
      high: maxHigh,
      low: minLow,
      volume: parseInt(sumVolume, 10),
      time: moment(candleDate).utc().startOf('hour'),
    });
  });

  return returnData;
};

const calculateDayTimeFrameData = (candles) => {
  const breakdownByDay = [];

  let insertArr = [];
  let currentDay = new Date(candles[0].time).getUTCDate();

  candles.forEach(candle => {
    const candleDay = new Date(candle.time).getUTCDate();

    if (candleDay !== currentDay) {
      breakdownByDay.push(insertArr);
      insertArr = [];
      currentDay = candleDay;
    }

    insertArr.push(candle);
  });

  breakdownByDay.push(insertArr);

  const returnData = [];

  breakdownByDay.forEach(dayCandles => {
    const arrLength = dayCandles.length;

    const open = dayCandles[0].open;
    const close = dayCandles[arrLength - 1].close;
    const candleDate = dayCandles[0].time;

    let sumVolume = 0;
    let minLow = dayCandles[0].low;
    let maxHigh = dayCandles[0].high;

    dayCandles.forEach(candle => {
      if (candle.high > maxHigh) {
        maxHigh = candle.high;
      }

      if (candle.low < minLow) {
        minLow = candle.low;
      }

      sumVolume += candle.volume;
    });

    returnData.push({
      open,
      close,
      high: maxHigh,
      low: minLow,
      volume: parseInt(sumVolume, 10),
      time: moment(candleDate).utc().startOf('day'),
    });
  });

  return returnData;
};
