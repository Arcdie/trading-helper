const path = require('path');

const {
  parseCSVToJSON,
} = require('../controllers/files/utils/parse-csv-to-json');

const InstrumentNew = require('../models/InstrumentNew');

module.exports = async () => {
  return;
  console.time('experiment');
  console.log('Experiment started');

  const data = [{"quantity":"500","direction":"long","numberTimes":793},{"quantity":"500","direction":"short","numberTimes":652},{"quantity":"200","direction":"long","numberTimes":611},{"quantity":"300","direction":"short","numberTimes":527},{"quantity":"300","direction":"long","numberTimes":511},{"quantity":"1000","direction":"short","numberTimes":502},{"quantity":"1000","direction":"long","numberTimes":497},{"quantity":"200","direction":"short","numberTimes":469}];




  console.timeEnd('experiment');
};
