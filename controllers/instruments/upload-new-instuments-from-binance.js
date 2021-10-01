const {
  createInstrument,
} = require('./utils/create-instrument');

const {
  getBinanceInstruments,
} = require('../binance/utils/get-binance-instruments');

const log = require('../../libs/logger');

module.exports = async (req, res, next) => {
  const {
    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  const resultGetInstruments = await getBinanceInstruments();

  if (!resultGetInstruments || !resultGetInstruments.status) {
    return res.json({
      status: false,
      message: resultGetInstruments.message || 'Cant getBinanceInstruments',
    });
  }

  let countNewInstuments = 0;

  const filteredInstruments = resultGetInstruments.result.filter(
    ({ symbol }) => symbol.includes('USDT'),
  );

  await Promise.all(filteredInstruments.map(async instrument => {
    const resultCreate = await createInstrument({
      nameSpot: instrument.symbol,
      nameFutures: `${instrument.symbol}PERP`,
      price: parseFloat(instrument.price),

      isActive: true,
    });

    if (!resultCreate || !resultCreate.status) {
      log.warn(resultCreate.message || 'Cant createInstrument');
      return null;
    }

    if (resultCreate.isCreated) {
      countNewInstuments += 1;
    }
  }));

  return res.json({
    status: true,
    result: {
      countNewInstuments,
    },
  });
};
