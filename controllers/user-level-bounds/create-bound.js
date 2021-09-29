const {
  isMongoId,
} = require('validator');

const {
  DEFAULT_INDENT_IN_PERCENTS,
} = require('./constants');

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

    const percentFromPrice = price * (DEFAULT_INDENT_IN_PERCENTS / 100);

    const newLevel = new UserLevelBound({
      user_id: userId,
      instrument_id: instrumentId,

      price_original: price,
      price_plus_indent: price + percentFromPrice,
      price_minus_indent: price - percentFromPrice,
    });

    await newLevel.save();

    result.push(newLevel._doc);
  }));

  return res.json({
    status: true,
    result,
  });
};
