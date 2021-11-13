const {
  isMongoId,
} = require('validator');

const {
  createStopLossOrder,
} = require('./create-stoploss-order');

const UserTradeBound = require('../../../models/UserTradeBound');

const checkUserTradeBounds = async ({
  instrumentId,
  instrumentName,
  instrumentPrice,
}) => {
  if (!instrumentId || !isMongoId(instrumentId.toString())) {
    return {
      status: false,
      message: 'No or invalid instrumentId',
    };
  }

  if (!instrumentName) {
    return {
      status: false,
      message: 'No instrumentName',
    };
  }

  if (!instrumentPrice) {
    return {
      status: false,
      message: 'No instrumentPrice',
    };
  }

  const activeUserTradeBounds = await UserTradeBound.find({
    instrument_id: instrumentId,
    is_active: true,
  }, {
    is_long: 1,
    takeprofit_price: 1,
  }).exec();

  if (!activeUserTradeBounds || !activeUserTradeBounds.length) {
    return {
      status: true,
    };
  }

  await Promise.all(activeUserTradeBounds.map(async bound => {
    if ((bound.is_long && instrumentPrice > bound.takeprofit_price)
      || (!bound.is_long && instrumentPrice < bound.takeprofit_price)) {
      const resultCreateStopLossOrder = await createStopLossOrder({
        instrumentName,
        instrumentPrice,
        userTradeBoundId: bound._id,
      });

      if (!resultCreateStopLossOrder || !resultCreateStopLossOrder.status) {
        return {
          status: false,
          message: resultCreateStopLossOrder.message || 'Cant createStopLossOrder (check bounds)',
        };
      }
    }
  }));

  return {
    status: true,
  };
};

module.exports = {
  checkUserTradeBounds,
};
