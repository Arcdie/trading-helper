const {
  isMongoId,
} = require('validator');

const {
  sendData,
} = require('../../../websocket/websocket-server');

const Candle4h = require('../../../models/Candle-4h');

const create4hCandle = async ({
  instrumentId,
  startTime,
  open,
  close,
  high,
  low,
  volume,
}) => {
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
  volume = parseFloat(volume);

  const existCandle = await Candle4h.findOne({
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

    existCandle.volume += volume;
    existCandle.volume = parseInt(existCandle.volume, 10);

    updateObj.volume = existCandle.volume;

    await Candle4h.findByIdAndUpdate(existCandle._id, updateObj).exec();

    sendData({
      actionName: 'candle4hData',
      data: {
        instrumentId,
        startTime,
        open,
        close,
        high,
        low,
        volume,
      },
    });

    return {
      status: true,
      result: existCandle._doc,
    };
  }

  const newCandle = new Candle4h({
    instrument_id: instrumentId,
    data: [open, close, low, high],

    volume,
    time: startTime,
  });

  await newCandle.save();

  sendData({
    actionName: 'candle4hData',
    data: {
      instrumentId,
      startTime,
      open,
      close,
      high,
      low,
      volume,
    },
  });

  return {
    status: true,
    result: newCandle._doc,
  };
};

module.exports = {
  create4hCandle,
};
