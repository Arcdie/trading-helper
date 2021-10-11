const {
  isInteger,
} = require('lodash');

const {
  isMongoId,
} = require('validator');

const log = require('../../libs/logger');

const Instrument = require('../../models/Instrument');

module.exports = async (req, res, next) => {
  const {
    body: {
      instrumentId,
      nameSpot,

      value,
      direction,
      isBothDirection,
    },

    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  if (instrumentId) {
    if (!isMongoId(instrumentId)) {
      return res.json({
        status: false,
        message: 'Invalid instrumentId',
      });
    }
  }

  if (!instrumentId && !nameSpot) {
    return res.json({
      status: false,
      message: 'No instrumentId and nameSpot',
    });
  }

  if (!direction || !['long', 'short'].includes(direction)) {
    return res.json({
      status: false,
      message: 'No or invalid direction',
    });
  }

  if (!value || !isInteger(parseInt(value, 10)) || value < 0) {
    return res.json({
      status: false,
      message: 'No or invalid value',
    });
  }

  let instrumentDoc;

  if (instrumentId) {
    instrumentDoc = await Instrument.findById(instrumentId).exec();
  } else {
    instrumentDoc = await Instrument.findOne({
      name_spot: nameSpot,
    }).exec();
  }

  if (!instrumentDoc) {
    return res.json({
      status: false,
      message: 'No Instrument',
    });
  }

  if (!instrumentDoc.does_exist_robot) {
    instrumentDoc.does_exist_robot = true;
  }

  const ticks = instrumentDoc.tick_sizes_for_robot;

  if (isBothDirection) {
    const doesExistThisValueWithLongDirection = ticks.some(
      tick => tick.value === value && tick.direction === 'long',
    );

    const doesExistThisValueWithShortDirection = ticks.some(
      tick => tick.value === value && tick.direction === 'short',
    );

    if (doesExistThisValueWithLongDirection
      && doesExistThisValueWithShortDirection) {
      log.warn('Tick with this value and direction already exists');

      return res.json({
        status: true,
        result: instrumentDoc._doc,
      });
    }

    if (!doesExistThisValueWithLongDirection) {
      instrumentDoc.tick_sizes_for_robot.push({
        value,
        direction: 'long',
      });
    }

    if (!doesExistThisValueWithShortDirection) {
      instrumentDoc.tick_sizes_for_robot.push({
        value,
        direction: 'short',
      });
    }

    await instrumentDoc.save();
  } else {
    const doesExistThisValue = ticks.some(
      tick => tick.value === value && tick.direction === direction,
    );

    if (doesExistThisValue) {
      log.warn('Tick with this value and direction already exists');

      return res.json({
        status: true,
        result: instrumentDoc._doc,
      });
    }

    instrumentDoc.tick_sizes_for_robot.push({
      value,
      direction,
    });
  }

  await instrumentDoc.save();

  return res.json({
    status: true,
    result: instrumentDoc._doc,
  });
};
