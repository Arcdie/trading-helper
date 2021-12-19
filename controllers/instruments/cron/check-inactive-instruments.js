const {
  isUndefined,
} = require('lodash');

const log = require('../../../libs/logger')(module);

const {
  getActiveInstruments,
} = require('../utils/get-active-instruments');

const {
  getSpotExchangeInfo,
} = require('../../binance/utils/spot/get-spot-exchange-info');

const {
  getFuturesExchangeInfo,
} = require('../../binance/utils/futures/get-futures-exchange-info');

module.exports = async (req, res, next) => {
  try {
    res.json({
      status: true,
    });

    const resultGetInstruments = await getActiveInstruments({});

    if (!resultGetInstruments || !resultGetInstruments.status) {
      const message = resultGetInstruments.message || 'Cant getActiveInstruments';

      log.warn(message);
      return res.json({
        status: true,
        message,
      });
    }

    const instrumentsDocs = resultGetInstruments.result || [];

    if (!instrumentsDocs || !instrumentsDocs.length) {
      return res.json({
        status: true,
      });
    }

    const spotDocs = instrumentsDocs.filter(doc => !doc.is_futures);
    const futuresDocs = instrumentsDocs.filter(doc => doc.is_futures);

    const instrumentsToRemove = [];

    if (spotDocs.length) {
      const resultGetExchangeInfo = await getSpotExchangeInfo();

      if (!resultGetExchangeInfo || !resultGetExchangeInfo.status) {
        log.warn(resultGetExchangeInfo.message || 'Cant getSpotExchangeInfo');
        return res.json({ status: false });
      }

      spotDocs.forEach(doc => {
        const doesExistInstrumentInExchangeInfo = resultGetExchangeInfo.result.symbols
          .some(symbol => symbol.symbol === doc.name);

        if (!doesExistInstrumentInExchangeInfo) {
          instrumentsToRemove.push(doc.name);
        }
      });
    }

    if (futuresDocs.length) {
      const resultGetExchangeInfo = await getFuturesExchangeInfo();

      if (!resultGetExchangeInfo || !resultGetExchangeInfo.status) {
        log.warn(resultGetExchangeInfo.message || 'Cant getFuturesExchangeInfo');
        return res.json({ status: false });
      }

      futuresDocs.forEach(doc => {
        const docName = doc.name.replace('PERP', '');

        const doesExistInstrumentInExchangeInfo = resultGetExchangeInfo.result.symbols
          .some(symbol => symbol.symbol === docName);

        if (!doesExistInstrumentInExchangeInfo) {
          instrumentsToRemove.push(doc.name);
        }
      });
    }

    if (instrumentsToRemove.length) {
      // todo: deactive instruments

      console.log('instrumentsToRemove', instrumentsToRemove);
    }
  } catch (error) {
    log.warn(error.message);

    res.json({
      status: false,
      message: error.message,
    });
  }
};
