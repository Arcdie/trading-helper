const {
  sendMessage,
} = require('../../../services/telegram-bot');

const UserLevelBound = require('../../../models/UserLevelBound');

const checkCrossing = async ({
  instrumentId,
  instrumentName,

  askPrice,
  bidPrice,
}) => {
  const targetBounds = await UserLevelBound.find({
    instrument_id: instrumentId,
    is_worked: false,

    $or: [{
      price_plus_indent: {
        $gte: askPrice,
      },

      price_original: {
        $lt: askPrice,
      },
    }, {
      price_minus_indent: {
        $lte: askPrice,
      },

      price_original: {
        $gt: askPrice,
      },
    }],
  }).exec();

  if (targetBounds && targetBounds.length) {
    const boundsIds = [];

    targetBounds.forEach(bound => {
      boundsIds.push(bound._id);

      const differenceBetweenPrices = Math.abs(bound.price_original - askPrice);
      const percentPerPrice = 100 / (askPrice / differenceBetweenPrices);

      sendMessage(`${instrumentName}
Уровень: ${bound.price_original}
Осталось: ${percentPerPrice.toFixed(2)}%`);
    });

    await UserLevelBound.updateMany({
      _id: {
        $in: boundsIds,
      },
    }, {
      $set: {
        is_worked: true,
        worked_at: new Date(),
      },
    });
  }

  return {
    status: true,
  };
};

module.exports = {
  checkCrossing,
};
