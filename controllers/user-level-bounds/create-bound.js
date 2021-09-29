const {
  isMongoId,
} = require('validator');

const {
  DEFAULT_INDENT_IN_PERCENTS,
} = require('./constants');

const Instrument = require('../../models/Instrument');
const UserLevelBound = require('../../models/UserLevelBound');

module.exports = async (req, res, next) => {
  const {
    body: {
      userId,
      instrumentId,
      prices,
    },
  } = req;

  if (!userId || !isMongoId(userId)) {
    return res.json({
      status: false,
      text: 'No or invalid userId',
    });
  }

  if (!instrumentId || !isMongoId(instrumentId)) {
    return res.json({
      status: false,
      text: 'No or invalid instrumentId',
    });
  }

  if (!prices || !Array.isArray(prices) || !prices.length) {
    return res.json({
      status: false,
      text: 'No or invalid prices',
    });
  }

  const instrumentDoc = await Instrument.findById(instrumentId, {
    price: 1,
  }).exec();

  if (!instrumentDoc) {
    return res.json({
      status: false,
      text: 'No Instrument',
    });
  }

  const result = [];

  await Promise.all(prices.map(async price => {
    const userLevelBound = await UserLevelBound.findOne({
      user_id: userId,
      instrument_id: instrumentId,

      price_original: price,

      is_worked: false,
    }).exec();

    if (userLevelBound) {
      result.push(userLevelBound._doc);
      return null;
    }

    const isLong = price > instrumentDoc.price;

    const newLevel = new UserLevelBound({
      user_id: userId,
      instrument_id: instrumentId,

      is_long: isLong,

      price_original: price,
      indent_in_percents: DEFAULT_INDENT_IN_PERCENTS,
    });

    await newLevel.save();

    result.push(newLevel._doc);
  }));

  return res.json({
    status: true,
    result,
  });
};
