const log = require('../../libs/logger')(module);

const {
  createInstrument,
} = require('./utils/create-instrument');

const {
  getSpotInstruments,
} = require('../binance/utils/spot/get-spot-instruments');

const {
  getFuturesInstruments,
} = require('../binance/utils/futures/get-futures-instruments');

module.exports = async (req, res, next) => {
  try {
    const {
      user,
    } = req;

    if (!user) {
      return res.json({
        status: false,
        message: 'Not authorized',
      });
    }

    const resultGetSpotInstruments = await getSpotInstruments();

    if (!resultGetSpotInstruments || !resultGetSpotInstruments.status) {
      return res.json({
        status: false,
        message: resultGetSpotInstruments.message || 'Cant getSpotInstruments',
      });
    }

    const resultGetFuturesInstruments = await getFuturesInstruments();

    if (!resultGetFuturesInstruments || !resultGetFuturesInstruments.status) {
      return res.json({
        status: false,
        message: resultGetFuturesInstruments.message || 'Cant getFuturesInstruments',
      });
    }

    let countNewSpotInstuments = 0;
    let countNewFuturesInstruments = 0;

    const filteredSpotInstruments = resultGetSpotInstruments.result.filter(
      ({ symbol }) => symbol.includes('USDT'),
    );

    const filteredFuturesInstruments = resultGetFuturesInstruments.result.filter(
      ({ symbol }) => symbol.includes('USDT'),
    );

    await Promise.all(filteredSpotInstruments.map(async instrument => {
      const resultCreate = await createInstrument({
        name: instrument.symbol,
        price: parseFloat(instrument.price),

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
      const resultCreate = await createInstrument({
        name: `${instrument.symbol}PERP`,
        price: parseFloat(instrument.price),

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

    return res.json({
      status: true,
      result: {
        countNewSpotInstuments,
        countNewFuturesInstruments,
      },
    });
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
