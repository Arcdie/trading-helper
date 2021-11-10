const {
  isMongoId,
} = require('validator');

const InstrumentNew = require('../../models/InstrumentNew');
const InstrumentRobotBound = require('../../models/InstrumentRobotBound');

module.exports = async (req, res, next) => {
  const {
    body: {
      quantity,
      direction,
      instrumentId,
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

  if (!instrumentName && !instrumentId) {
    return res.json({
      status: false,
      message: 'No instrumentName and instrumentId',
    });
  }

  if (instrumentId && !isMongoId(instrumentId)) {
    return res.json({
      status: false,
      message: 'Invalid instrumentId',
    });
  }

  if (!quantity) {
    return res.json({
      status: false,
      message: 'No quantity',
    });
  }

  if (!direction || !['short', 'long'].includes(direction)) {
    return res.json({
      status: false,
      message: 'No or invalid direction',
    });
  }

  let targetInstrumentId;

  if (instrumentId) {
    targetInstrumentId = instrumentId;
  } else {
    const instrumentDoc = await InstrumentNew.findOne({
      name: instrumentName,
    }, { _id: 1 }).exec();

    if (!instrumentDoc) {
      return res.json({
        status: false,
        message: 'No InstrumentNew',
      });
    }

    targetInstrumentId = instrumentDoc._id;
  }

  const isLong = direction === 'long';

  const existBound = await InstrumentRobotBound.findOne({
    instrument_id: targetInstrumentId,
    quantity,
    is_long: isLong,
  }).exec();

  if (existBound) {
    return res.json({
      status: true,
      result: existBound._doc,
    });
  }

  const newBound = new InstrumentRobotBound({
    instrument_id: targetInstrumentId,
    quantity,
    is_long: isLong,
  });

  await newBound.save();

  return res.json({
    status: true,
    result: newBound._doc,
  });
};
