const {
  isMongoId,
} = require('validator');

const {
  isUndefined,
} = require('lodash');

const log = require('../../../libs/logger')(module);

const Trade = require('../../../models/Trade');

const createTrade = async ({
  instrumentId,
  price,
  quantity,
  isLong,
  time,
}) => {
  try {
    if (!instrumentId || !isMongoId(instrumentId.toString())) {
      return {
        status: false,
        message: 'No or invalid instrumentId',
      };
    }

    if (!price) {
      return {
        status: false,
        message: 'No price',
      };
    }

    if (!quantity) {
      return {
        status: false,
        message: 'No quantity',
      };
    }

    if (isUndefined(isLong)) {
      return {
        status: false,
        message: 'No isLong',
      };
    }

    if (!time) {
      return {
        status: false,
        message: 'No time',
      };
    }

    price = parseFloat(price);
    quantity = parseFloat(quantity);

    const existTrade = await Trade.findOne({
      instrument_id: instrumentId,
      is_long: isLong,
      price,
      quantity,
      time,
    }).exec();

    if (!existTrade) {
      const newTrade = new Trade({
        instrument_id: instrumentId,
        is_long: isLong,
        price,
        quantity,
        time,
      });

      await newTrade.save();

      return {
        status: true,
        result: newTrade._doc,
      };
    }

    return {
      status: true,
      result: existTrade._doc,
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
  createTrade,
};
