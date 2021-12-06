const {
  isUndefined,
} = require('lodash');

const log = require('../../../libs/logger')(module);

const {
  getSpotExchangeInfo,
} = require('../../binance/utils/spot/get-spot-exchange-info');

const {
  getFuturesExchangeInfo,
} = require('../../binance/utils/futures/get-futures-exchange-info');

const {
  renewInstrumentsInRedis,
} = require('../utils/renew-instruments-in-redis');

const InstrumentNew = require('../../../models/InstrumentNew');

module.exports = async (req, res, next) => {
  try {
    const instrumentsDocs = await InstrumentNew.find({}).exec();

    const spotDocs = instrumentsDocs.filter(doc => !doc.is_futures);
    const futuresDocs = instrumentsDocs.filter(doc => doc.is_futures);

    if (spotDocs.length) {
      const resultGetExchangeInfo = await getSpotExchangeInfo();

      if (!resultGetExchangeInfo || !resultGetExchangeInfo.status) {
        log.warn(resultGetExchangeInfo.message || 'Cant getSpotExchangeInfo');
        return res.json({ status: false });
      }

      await Promise.all(spotDocs.map(async doc => {
        const targetSymbol = resultGetExchangeInfo.result.symbols
          .find(symbol => symbol.symbol === doc.name);

        if (!targetSymbol) {
          log.warn(`Cant find ${doc.name}`);
          return null;
        }

        const { tickSize } = targetSymbol.filters[0];
        const { stepSize } = targetSymbol.filters[2];

        if (!tickSize) {
          log.warn(`No tickSize, ${doc.name}`);
          return null;
        }

        if (!stepSize) {
          log.warn(`No stepSize, ${doc.name}`);
          return null;
        }

        doc.step_size = parseFloat(stepSize);
        doc.tick_size = parseFloat(tickSize);

        await doc.save();
      }));
    }

    if (futuresDocs.length) {
      const resultGetExchangeInfo = await getFuturesExchangeInfo();

      if (!resultGetExchangeInfo || !resultGetExchangeInfo.status) {
        log.warn(resultGetExchangeInfo.message || 'Cant getFuturesExchangeInfo');
        return res.json({ status: false });
      }

      await Promise.all(futuresDocs.map(async doc => {
        const docName = doc.name.replace('PERP', '');

        const targetSymbol = resultGetExchangeInfo.result.symbols
          .find(symbol => symbol.symbol === docName);

        if (!targetSymbol) {
          log.warn(`Cant find ${doc.name}`);
          return null;
        }

        const { pricePrecision } = targetSymbol;
        const { tickSize } = targetSymbol.filters[0];
        const { stepSize } = targetSymbol.filters[2];

        if (isUndefined(pricePrecision)) {
          log.warn(`No pricePrecision, ${doc.name}`);
          return null;
        }

        if (!tickSize) {
          log.warn(`No tickSize, ${doc.name}`);
          return null;
        }

        if (!stepSize) {
          log.warn(`No stepSize, ${doc.name}`);
          return null;
        }

        doc.step_size = parseFloat(stepSize);
        doc.tick_size = parseFloat(tickSize);
        doc.price_precision = parseInt(pricePrecision, 10);

        await doc.save();
      }));
    }

    await renewInstrumentsInRedis();

    return res.json({
      status: true,
    });
  } catch (error) {
    log.warn(error.message);

    return {
      status: false,
      message: error.message,
    };
  }
};
