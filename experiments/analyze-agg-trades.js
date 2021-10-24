const path = require('path');

const {
  parseCSVToJSON,
} = require('../controllers/files/utils/parse-csv-to-json');

const InstrumentNew = require('../models/InstrumentNew');

module.exports = async () => {
  return;
  console.time('experiment');
  console.log('Experiment started');

  const instrumentName = 'ADAUSDTPERP';
  const fileName = 'ADAUSDT-aggTrades-2021-10-22';

  const instrumentDoc = await InstrumentNew.findOne({
    name: instrumentName,
    is_active: true,
  }).exec();

  if (!instrumentDoc) {
    console.log('No Instrument');
    return true;
  }

  const resultGetFile = await parseCSVToJSON({
    pathToFile: path.resolve(__dirname, '../files/aggTrades/daily', `${fileName}.csv`),
  });

  if (!resultGetFile || !resultGetFile.status) {
    console.log(resultGetFile.message || 'Cant parseCSVToJSON');
    return true;
  }

  const minQuantity = 300 / instrumentDoc.price;

  const {
    result,
  } = resultGetFile;

  const data = [];
  const arrData = [];

  result.forEach(([
    tradeId,
    price,
    quantity,
    firstTradeId,
    lastTradeId,
    timestamp,
    direction,
  ]) => {
    direction = direction === 'true' ? 'short' : 'long';

    if (quantity >= minQuantity) {
      const key = `q${quantity}-${direction}`;

      if (!data[key]) {
        data[key] = {
          quantity,
          direction,
          numberTimes: 0,
        };
      }

      data[key].numberTimes += 1;
    }
  });

  Object.keys(data).forEach(key => {
    arrData.push(data[key]);
  });

  const sortedData = arrData.sort((a, b) => {
    if (a.numberTimes < b.numberTimes) {
      return -1;
    }

    return 1;
  });



  /*
  const lData = sortedData.length;

  for (let i = 0; i < lData; i += 1) {
    if (sortedData[i].numberTimes > 5) {
      console.log('q:', sortedData[i].quantity, sortedData[i].direction, sortedData[i].numberTimes);
    }
  }

  const targetData = [];

  for (let i = lData - 1; i > lData - 9; i -= 1) {
    targetData.push(sortedData[i]);
  }

  console.log(JSON.stringify(targetData));
  */


  console.timeEnd('experiment');
};
