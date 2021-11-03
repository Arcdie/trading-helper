const {
  isMongoId,
} = require('validator');

const {
  sendData,
} = require('../../../websocket/websocket-server');

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

  const existCandle = await Candle1h.findOne({
    instrument_id: instrumentId,
    time: startTime,
  }, { data: 1 }).exec();

  if (existCandle) {
    let isUpdate = false;

    if (high > existCandle.data[3]) {
      isUpdate = true;
      existCandle.data[3] = high;
    }

    if (low < existCandle.data[2]) {
      isUpdate = true;
      existCandle.data[2] = low;
    }

    if (close !== existCandle.data[1]) {
      isUpdate = true;
      existCandle.data[1] = close;
    }

    if (isUpdate) {
      await Candle1h.findByIdAndUpdate(existCandle._id, {
        data: existCandle.data,
      }).exec();

      sendData({
        actionName: 'candle1hData',
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
    }

    return {
      status: true,
      result: existCandle._doc,
    };
  }

  const newCandle = new Candle1h({
    instrument_id: instrumentId,
    data: [open, close, low, high],
    volume: parseFloat(volume),
    time: startTime,
  });

  await newCandle.save();

  sendData({
    actionName: 'candle1hData',
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
  create1hCandle,
};
