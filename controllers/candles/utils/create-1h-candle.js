const {
  isMongoId,
} = require('validator');

const log = require('../../../libs/logger')(module);

const Candle1h = require('../../../models/Candle-1h');

const create1hCandle = async ({
  instrumentId,
  startTime,
  open,
  close,
  high,
  low,
  volume,
}) => {
  try {
    if (!instrumentId || !isMongoId(instrumentId.toString())) {
      return {
        status: false,
        message: 'No or invalid instrumentId',
      };
    }

    if (!startTime) {
      return {
        status: false,
        message: 'No startTime',
      };
    }

    if (!open) {
      return {
        status: false,
        message: 'No open',
      };
    }

    if (!close) {
      return {
        status: false,
        message: 'No close',
      };
    }

    if (!high) {
      return {
        status: false,
        message: 'No high',
      };
    }

    if (!low) {
      return {
        status: false,
        message: 'No low',
      };
    }

    if (!volume) {
      return {
        status: false,
        message: 'No volume',
      };
    }

    open = parseFloat(open);
    close = parseFloat(close);
    high = parseFloat(high);
    low = parseFloat(low);
    volume = parseInt(volume, 10);

    const existCandle = await Candle1h.findOne({
      instrument_id: instrumentId,
      time: startTime,
    }, {
      data: 1,
      volume: 1,
    }).exec();

    if (existCandle) {
      const updateObj = {};

      if (high > existCandle.data[3]) {
        existCandle.data[3] = high;
        updateObj.data = existCandle.data;
      }

      if (low < existCandle.data[2]) {
        existCandle.data[2] = low;
        updateObj.data = existCandle.data;
      }

      if (close !== existCandle.data[1]) {
        existCandle.data[1] = close;
        updateObj.data = existCandle.data;
      }

      if (existCandle.volume !== volume) {
        existCandle.volume = volume;
        updateObj.volume = existCandle.volume;
      }

      await Candle1h.findByIdAndUpdate(existCandle._id, updateObj).exec();

      return {
        status: true,
        isCreated: false,
        result: existCandle._doc,
      };
    }

    const newCandle = new Candle1h({
      instrument_id: instrumentId,
      data: [open, close, low, high],

      volume,
      time: startTime,
    });

    await newCandle.save();

    return {
      status: true,
      isCreated: true,
      result: newCandle._doc,
    };
  } catch (error) {
    log.error(error.message);

    return {
      status: true,
      message: error.message,
    };
  }
};

module.exports = {
  create1hCandle,
};
