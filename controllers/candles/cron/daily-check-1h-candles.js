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
  create1hCandles,
} = require('../utils/create-1h-candles');

const {
  parseCSVToJSON,
} = require('../../files/utils/parse-csv-to-json');

const {
  getActiveInstruments,
} = require('../../instruments/utils/get-active-instruments');

const Candle1h = require('../../../models/Candle-1h');

// todo: need test

module.exports = async (req, res) => {
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
      const candles1hDocs = await Candle1h.find({
        instrument_id: instrumentDoc._id,

        time: { $lt: startDate },
      }, { time: 1 }).sort({ time: 1 }).exec();

      if (!candles1hDocs.length) {
        continue;
      }

      let datesToDownload = [];
      const candlesTimeToCreate = [];
      let nextTimeUnix = getUnix(candles1hDocs[0].time);

      while (nextTimeUnix !== startDateUnix) {
        const candleDoc = candles1hDocs[0];
        const candleTimeUnix = getUnix(candleDoc.time);

        if (nextTimeUnix !== candleTimeUnix) {
          candlesTimeToCreate.push(nextTimeUnix);
        } else {
          candles1hDocs.shift();
        }

        nextTimeUnix += 3600;
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

      const pathToFolder = path.join(__dirname, `../../../files/klines/daily/1h/${instrumentDoc.name}`);

      if (!fs.existsSync(pathToFolder)) {
        fs.mkdirSync(pathToFolder);
      }

      const links = datesToDownload.map(date => ({
        startOfDayUnix: date.startOfDayUnix,
        link: `data/${typeInstrument}/daily/klines/${instrumentName}/1h/${instrumentName}-1h-${date.year}-${date.month}-${date.day}.zip`,
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
          const resultCreateCandles = await create1hCandles({
            isFutures: instrumentDoc.is_futures,
            newCandles,
          });

          if (!resultCreateCandles || !resultCreateCandles.status) {
            log.warn(resultCreateCandles.message || 'Cant create1hCandles');
          }
        }
      }

      removeFolder(pathToFolder);
    }
  } catch (error) {
    console.log(error);
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
