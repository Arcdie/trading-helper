const fs = require('fs');
const path = require('path');
const util = require('util');
const xml2js = require('xml2js');
const moment = require('moment');

const {
  getQueue,
} = require('../libs/support');

const {
  createTrade,
} = require('../controllers/trades/utils/create-trade');

const {
  parseCSVToJSON,
} = require('../controllers/files/utils/parse-csv-to-json');

const log = require('../libs/logger');

const Trade = require('../models/Trade');
const InstrumentNew = require('../models/InstrumentNew');
const InstrumentRobotBound = require('../models/InstrumentRobotBound');

xml2js.parseStringPromise = util.promisify(xml2js.parseString);

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  const instrumentsDocs = await InstrumentNew
    .find({
      _id: {
        $nin: ['616f0f7190a7836ed8d5e19f', '616f0f7290a7836ed8d5e23f'],
      },

      is_active: true,
      does_exist_robot: true,
    })
    .sort({ name: 1 })
    .exec();

  if (!instrumentsDocs || !instrumentsDocs.length) {
    console.timeEnd('migration');
    return true;
  }

  let processedInstruments = 0;
  const totalInstruments = instrumentsDocs.length;

  const checkInterval = setInterval(() => {
    log.info(`${processedInstruments} / ${totalInstruments}`);
  }, 10 * 1000);

  for (const instrumentDoc of instrumentsDocs) {
    console.log(`Started ${instrumentDoc.name}`);

    const instrumentRobotBounds = await InstrumentRobotBound.find({
      instrument_id: instrumentDoc._id,
      is_active: true,
    }).exec();

    if (!instrumentRobotBounds || !instrumentRobotBounds.length) {
      console.log('No instrumentRobotBounds');
      console.timeEnd('migration');
      continue;
    }

    const targetRobots = instrumentRobotBounds.map(bound => ({
      quantity: bound.quantity,
      direction: bound.is_long ? 'long' : 'short',
    }));

    const pathToFolder = path.join(__dirname, `../files/aggTrades/daily/${instrumentDoc.name}`);

    const filesNames = [];

    fs
      .readdirSync(pathToFolder)
      .forEach(fileName => {
        filesNames.push(fileName);
      });

    const queues = getQueue(filesNames, 3);

    for (const filesNames of queues) {
      await Promise.all(filesNames.map(async fileName => {
        const pathToFile = `${pathToFolder}/${fileName}`;

        const resultGetFile = await parseCSVToJSON({
          pathToFile,
        });

        if (!resultGetFile || !resultGetFile.status) {
          log.warn(resultGetFile.message || 'Cant parseCSVToJSON');
          return null;
        }

        const targetData = [];

        resultGetFile.result.forEach(data => {
          let [
            tradeId,
            price,
            quantity,
            firstTradeId,
            lastTradeId,
            timestamp,
            direction,
          ] = data;

          direction = (direction === 'true') ? 'short' : 'long';
          const isLong = direction === 'long';

          price = parseFloat(price);
          quantity = parseFloat(quantity);

          const doesExistInTargetRobots = targetRobots.some(
            targetRobot => targetRobot.quantity === quantity
              && targetRobot.direction === direction,
          );

          if (doesExistInTargetRobots) {
            targetData.push({
              price,
              quantity,
              is_long: isLong,
              time: moment.unix(timestamp / 1000),
            });
          }
        });

        await Promise.all(targetData.map(async data => {
          const resultCreateTrade = await createTrade({
            instrumentId: instrumentDoc._id,
            price: data.price,
            quantity: data.quantity,
            isLong: data.is_long,
            time: data.time,
          });

          if (!resultCreateTrade || !resultCreateTrade.status) {
            log.warn(resultCreateTrade.message || 'Cant createTrade');
            return null;
          }
        }));

        console.log(`Ended ${fileName}`);
      }));
    }

    processedInstruments += 1;
  }

  clearInterval(checkInterval);
  console.timeEnd('migration');
};
