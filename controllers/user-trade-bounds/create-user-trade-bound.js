const {
  createUserTradeBound,
} = require('./utils/create-user-trade-bound');

const InstrumentNew = require('../../models/InstrumentNew');

module.exports = async (req, res, next) => {
  const {
    body: {
      side,
      quantity,
      instrumentName,
    },

    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  if (!instrumentName) {
    return res.json({
      status: false,
      message: 'No instrumentName',
    });
  }

  if (!side || !['BUY', 'SELL'].includes(side)) {
    return res.json({
      status: false,
      message: 'No or invalid side',
    });
  }

  if (!quantity) {
    return res.json({
      status: false,
      message: 'No quantity',
    });
  }

  const instrumentDoc = await InstrumentNew.findOne({
    name: instrumentName,
  }).exec();

  if (!instrumentDoc) {
    return res.json({
      status: false,
      message: 'No Instrument',
    });
  }

  if (!instrumentDoc.is_active) {
    return res.json({
      status: false,
      message: 'Instrument is not active',
    });
  }

  const resultCreateBound = await createUserTradeBound({
    userId: user._id,
    instrumentId: instrumentDoc._id,
    instrumentName: instrumentDoc.name,

    side,
    type: 'MARKET',
    quantity,
  });

  if (!resultCreateBound || !resultCreateBound.status) {
    return res.json({
      status: false,
      message: resultCreateBound.message || 'Cant createUserTradeBound',
    });
  }

  return res.json({
    status: true,
  });
};
