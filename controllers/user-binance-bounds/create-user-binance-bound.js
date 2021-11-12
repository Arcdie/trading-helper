const {
  createFuturesListenKey,
} = require('../../controllers/binance/utils/futures/create-futures-listen-key');

const UserBinanceBound = require('../../models/UserBinanceBound');

module.exports = async (req, res, next) => {
  const {
    body: {
      apikey,
      secret,
    },

    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  if (!apikey) {
    return res.json({
      status: false,
      message: 'No apikey',
    });
  }

  if (!secret) {
    return res.json({
      status: false,
      message: 'No secret',
    });
  }

  const resultRequestCreateListenKey = await createFuturesListenKey({
    apikey,
  });

  if (!resultRequestCreateListenKey || !resultRequestCreateListenKey.status) {
    return res.json({
      status: false,
      message: resultRequestCreateListenKey.message || 'Cant createFuturesListenKey',
    });
  }

  const resultCreateListenKey = resultRequestCreateListenKey.result;

  if (!resultCreateListenKey || !resultCreateListenKey.listenKey) {
    return res.json({
      status: false,
      message: 'No listenKey',
    });
  }

  const doesExistBound = await UserBinanceBound.findOne({
    user_id: user._id,
  }).exec();

  if (doesExistBound) {
    await UserBinanceBound.findByIdAndUpdate(doesExistBound._id, {
      is_active: true,
      apikey,
      secret,
      listen_key: resultCreateListenKey.listenKey,
      listen_key_updated_at: new Date(),
    }).exec();

    return res.json({
      status: true,
    });
  }

  const newBound = new UserBinanceBound({
    user_id: user._id,
    apikey,
    secret,
    listen_key: resultCreateListenKey.listenKey,
    listen_key_updated_at: new Date(),
  });

  await newBound.save();

  return res.json({
    status: true,
  });
};
