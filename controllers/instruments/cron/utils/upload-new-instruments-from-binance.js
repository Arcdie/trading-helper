const {
  isUndefined,
} = require('lodash');

const log = require('../../../../libs/logger')(module);

const {
  createInstrument,
} = require('../../utils/create-instrument');

const {
  getSpotExchangeInfo,
} = require('../../../binance/utils/spot/get-spot-exchange-info');

const {
  getFuturesExchangeInfo,
} = require('../../../binance/utils/futures/get-futures-exchange-info');

const uploadNewInstrumentsFromBinance = async () => {
  try {
    const resultGetSpotInstruments = await getSpotExchangeInfo();

    if (!resultGetSpotInstruments || !resultGetSpotInstruments.status) {
      return {
        status: false,
        message: resultGetSpotInstruments.message || 'Cant getSpotExchangeInfo',
      };
    }

    const resultGetFuturesInstruments = await getFuturesExchangeInfo();

    if (!resultGetFuturesInstruments || !resultGetFuturesInstruments.status) {
      return {
        status: false,
        message: resultGetFuturesInstruments.message || 'Cant getFuturesExchangeInfo',
      };
    }

    let countNewSpotInstuments = 0;
    let countNewFuturesInstruments = 0;

    const spotInstruments = resultGetSpotInstruments.result.symbols;
    const futuresInstruments = resultGetFuturesInstruments.result.symbols;

    const filteredSpotInstruments = spotInstruments.filter(
      ({ symbol }) => symbol.includes('USDT'),
    );

    const filteredFuturesInstruments = futuresInstruments.filter(
      ({ symbol }) => symbol.includes('USDT'),
    );

    await Promise.all(filteredSpotInstruments.map(async instrument => {
      const { tickSize } = instrument.filters[0];
      const { stepSize } = instrument.filters[2];

      if (!tickSize) {
        log.warn(`No tickSize, ${instrument.symbol}`);
        return null;
      }

      if (!stepSize) {
        log.warn(`No stepSize, ${instrument.symbol}`);
        return null;
      }

      const resultCreate = await createInstrument({
        name: instrument.symbol,
        price: 1,

        tickSize: parseFloat(tickSize),
        stepSize: parseFloat(stepSize),

        isFutures: false,
      });

      if (!resultCreate || !resultCreate.status) {
        log.warn(resultCreate.message || 'Cant createInstrument');
        return null;
      }

      if (resultCreate.isCreated) {
        countNewSpotInstuments += 1;
      }
    }));

    await Promise.all(filteredFuturesInstruments.map(async instrument => {
      const { pricePrecision } = instrument;
      const { tickSize } = instrument.filters[0];
      const { stepSize } = instrument.filters[2];

      if (!tickSize) {
        log.warn(`No tickSize, ${instrument.symbol}`);
        return null;
      }

      if (!stepSize) {
        log.warn(`No stepSize, ${instrument.symbol}`);
        return null;
      }

      if (isUndefined(pricePrecision)) {
        log.warn(`No pricePrecision, ${instrument.symbol}`);
        return null;
      }

      const resultCreate = await createInstrument({
        name: `${instrument.symbol}PERP`,
        price: 1,

        tickSize: parseFloat(tickSize),
        stepSize: parseFloat(stepSize),
        pricePrecision: parseFloat(pricePrecision),

        isFutures: true,
      });

      if (!resultCreate || !resultCreate.status) {
        log.warn(resultCreate.message || 'Cant createInstrument');
        return null;
      }

      if (resultCreate.isCreated) {
        countNewFuturesInstruments += 1;
      }
    }));

    return {
      status: true,
      result: {
        countNewSpotInstuments,
        countNewFuturesInstruments,
      },
    };
  } catch (error) {
    log.warn(error.message);

    return {
      status: false,
      message: error.message,
    };
  }
};

module.exports = {
  uploadNewInstrumentsFromBinance,
};
