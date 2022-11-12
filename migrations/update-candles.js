// # migration for primary downloading / updating candles for all timeframes

/* Should be inited when previous month is made in binance */

const fs = require('fs');
const path = require('path');
const util = require('util');
const axios = require('axios');
const moment = require('moment');
const xml2js = require('xml2js');
const AdmZip = require('adm-zip');

const log = require('../libs/logger')(module);

const {
  getUnix,
} = require('../libs/support');

const {
  parseCSVToJSON,
} = require('../controllers/files/utils/parse-csv-to-json');

const {
  create1mCandles,
} = require('../controllers/candles/utils/create-1m-candles');

const {
  create5mCandles,
} = require('../controllers/candles/utils/create-5m-candles');

const {
  create1hCandles,
} = require('../controllers/candles/utils/create-1h-candles');

const {
  INTERVALS,
  LIFETIME_1M_CANDLES,
  LIFETIME_5M_CANDLES,
} = require('../controllers/candles/constants');

const Candle1m = require('../models/Candle-1m');
const Candle5m = require('../models/Candle-5m');
const Candle1h = require('../models/Candle-1h');
const Candle4h = require('../models/Candle-4h');
const Candle1d = require('../models/Candle-1d');
const InstrumentNew = require('../models/InstrumentNew');

xml2js.parseStringPromise = util.promisify(xml2js.parseString);

module.exports = async () => {
  // settings
  return;

  const timeframe = INTERVALS.get('5m');
  const targetInstrumentsIds = [];
  const targetInstrumentsNames = [];

  // logic
  console.time('migration');
  console.log('Migration started');

  const Candle = getCandelModelByTimeframe(timeframe);

  let findCondition = {
    is_active: true,
    is_futures: true,
  };

  if (targetInstrumentsIds.length) {
    findCondition = {
      _id: { $in: targetInstrumentsIds },
    };
  } else if (targetInstrumentsNames.length) {
    findCondition = {
      name: { $in: targetInstrumentsNames },
    };
  }

  const instrumentsDocs = await InstrumentNew.find(findCondition).exec();
  const incrementProcessedInstruments = processedInstrumentsCounter(instrumentsDocs.length);

  for await (const instrumentDoc of instrumentsDocs) {
    const candles = await Candle.find({
      instrument_id: instrumentDoc.id,
    }).sort({ time: 1 }).limit(10).exec();

    if (candles.length) {
      // const startTime = moment(candles[0].time).unix();
      // ...

      continue;
    }

    let links = [];
    let pathToFolder;
    const timeframeLifetime = getTimeframeLifetime(timeframe);
    const createCandles = getCreateCandlesFunction(timeframe);

    if (timeframeLifetime) {
      links = await getDailyLinks(timeframe, instrumentDoc);
      const startOfTodayUnix = moment().startOf('day').unix();
      const startDownloadingDateUnix = startOfTodayUnix - timeframeLifetime;
      links = links.filter(link => getUnix(link.date) > startDownloadingDateUnix);
      pathToFolder = path.join(__dirname, `../files/klines/daily/${timeframe}/${instrumentDoc.name}`);
    } else {
      links = await getMonthlyLinks(timeframe, instrumentDoc);
      pathToFolder = path.join(__dirname, `../files/klines/monthly/${timeframe}/${instrumentDoc.name}`);

      const currentYear = moment().year();
      const currentMonth = moment().month();
      const dailyLinks = await getDailyLinks(timeframe, instrumentDoc);

      links.push(
        ...dailyLinks
          .filter(link => currentMonth === link.date.getMonth())
          .filter(link => currentYear === link.date.getFullYear()),
      );
    }

    if (!fs.existsSync(pathToFolder)) {
      fs.mkdirSync(pathToFolder);
    }

    for await (const link of links) {
      console.log(`${instrumentDoc.name}: started load file ${link.link}`);

      const resultGetFile = await axios({
        method: 'get',
        url: `https://data.binance.vision/${link.link}`,
        responseType: 'arraybuffer',
      });

      const zip = new AdmZip(resultGetFile.data);
      zip.extractAllTo(pathToFolder, true);
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

      const newCandles = resultGetFile.result
        .map(candleData => {
          const [
            openTime,
            open,
            high,
            low,
            close,
            volume,
            // closeTime,
          ] = candleData;

          if (isNaN(parseFloat(open))) {
            return false;
          }

          return {
            instrumentId: instrumentDoc._id,
            startTime: new Date(parseInt(openTime, 10)),
            open,
            close,
            high,
            low,
            volume,
          };
        })
        .filter(e => e !== false);

      const resultCreateCandles = await createCandles({
        isFutures: instrumentDoc.is_futures,
        newCandles,
      });

      if (!resultCreateCandles || !resultCreateCandles.status) {
        log.warn(resultCreateCandles.message || 'Cant createCandles');
      } else {
        fs.unlinkSync(pathToFile);
      }
    }

    incrementProcessedInstruments();
    console.log(`Ended ${instrumentDoc.name}`);
  }

  console.timeEnd('migration');
};

const getCreateCandlesFunction = (timeframe) => {
  switch (timeframe) {
    case INTERVALS.get('1m'): return create1mCandles;
    case INTERVALS.get('5m'): return create5mCandles;
    case INTERVALS.get('1h'): return create1hCandles;
    default:
      throw new Error('No candle model for this timeframe');
  }
};

const getCandelModelByTimeframe = (timeframe) => {
  switch (timeframe) {
    case INTERVALS.get('1m'): return Candle1m;
    case INTERVALS.get('5m'): return Candle5m;
    case INTERVALS.get('1h'): return Candle1h;
    case INTERVALS.get('4h'): return Candle4h;
    case INTERVALS.get('1d'): return Candle1d;
    default:
      throw new Error('No candle model for this timeframe');
  }
};

const getTimeframeLifetime = (timeframe) => {
  switch (timeframe) {
    case INTERVALS.get('1m'): return LIFETIME_1M_CANDLES;
    case INTERVALS.get('5m'): return LIFETIME_5M_CANDLES;
    default: return 0;
  }
};

const getDailyLinks = async (timeframe, instrumentDoc, marker = '', links = []) => {
  const instrumentName = instrumentDoc.name.replace('PERP', '');

  let url = instrumentDoc.is_futures
    ? `https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/futures/um/daily/klines/${instrumentName}/${timeframe}/`
    : `https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/spot/daily/klines/${instrumentName}/${timeframe}/`;

  if (marker) {
    url += `&marker=${marker}`;
  }

  const responseGetPage = await axios({
    method: 'get',
    url,
  });

  const parsedXml = await xml2js.parseStringPromise(responseGetPage.data);

  if (!parsedXml.ListBucketResult
    || !parsedXml.ListBucketResult.Contents
    || !parsedXml.ListBucketResult.Contents.length) {
    log.warn('No ListBucketResult.Contents');
    return [];
  }

  parsedXml.ListBucketResult.Contents.forEach(content => {
    const {
      Key,
    } = content;

    if (!Key[0].includes('CHECKSUM')) {
      const link = Key[0];
      const splitLink = instrumentDoc.is_futures
        ? `data/futures/um/daily/klines/${instrumentName}/${timeframe}/${instrumentName}-${timeframe}-`
        : `data/spot/daily/klines/${instrumentName}/${timeframe}/${instrumentName}-${timeframe}-`;

      const date = link
        .split(splitLink)[1]
        .split('.zip')[0];

      links.push({
        link,
        date: new Date(date),
      });
    }
  });

  if (parsedXml.ListBucketResult.Contents.length === 1000) {
    const marker = links[links.length - 1].link;
    return getDailyLinks(timeframe, instrumentDoc, marker, links);
  }

  return links;
};

const getMonthlyLinks = async (timeframe, instrumentDoc) => {
  const instrumentName = instrumentDoc.name.replace('PERP', '');

  const url = instrumentDoc.is_futures
    ? `https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/futures/um/monthly/klines/${instrumentName}/${timeframe}/`
    : `https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/spot/monthly/klines/${instrumentName}/${timeframe}/`;

  const responseGetPage = await axios({
    method: 'get',
    url,
  });

  const links = [];
  const parsedXml = await xml2js.parseStringPromise(responseGetPage.data);

  if (!parsedXml.ListBucketResult
    || !parsedXml.ListBucketResult.Contents
    || !parsedXml.ListBucketResult.Contents.length) {
    log.warn('No ListBucketResult.Contents');
    return [];
  }

  parsedXml.ListBucketResult.Contents.forEach(content => {
    const {
      Key,
    } = content;

    if (!Key[0].includes('CHECKSUM')) {
      const link = Key[0];
      const splitLink = instrumentDoc.is_futures
        ? `data/futures/um/monthly/klines/${instrumentName}/${timeframe}/${instrumentName}-${timeframe}-`
        : `data/spot/monthly/klines/${instrumentName}/${timeframe}/${instrumentName}-${timeframe}-`;

      const date = link
        .split(splitLink)[1]
        .split('.zip')[0];

      links.push({
        link,
        date: new Date(`${date}-01`),
      });
    }
  });

  return links;
};

const processedInstrumentsCounter = function (numberInstruments = 0) {
  let processedInstruments = 0;

  return function () {
    processedInstruments += 1;
    log.info(`${processedInstruments} / ${numberInstruments}`);
  };
};

/*
const getEndTime = (timeframe) => {
  const now = moment();

  switch (timeframe) {
    case INTERVALS.get('1m'): return now.startOf('minute');
    case INTERVALS.get('5m'): return now.startOf('minute');
    case INTERVALS.get('1h'): return now.startOf('minute');
    case INTERVALS.get('4h'): return now.startOf('minute');
    case INTERVALS.get('1d'): return now.startOf('minute');
    default:
      throw new Error('No candle model for this timeframe');
  }
};
*/
