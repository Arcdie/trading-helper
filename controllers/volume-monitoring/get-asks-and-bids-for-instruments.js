const {
  isMongoId,
} = require('validator');

const redis = require('../../libs/redis');

const Instrument = require('../../models/Instrument');
const UserLevelBound = require('../../models/UserLevelBound');

module.exports = async (req, res, next) => {
  const {
    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  const instrumentsDocs = await Instrument.find({
    // tmp
    name_futures: 'ZENUSDTPERP',

    is_active: true,
  }, {
    name_spot: 1,
    name_futures: 1,
  }).exec();

  if (!instrumentsDocs || !instrumentsDocs.length) {
    return res.json({
      status: true,
      result: [],
    });
  }

  const validDocs = instrumentsDocs.map(doc => doc._doc);

  await Promise.all(validDocs.map(async doc => {
    let cacheDocAsks = await redis.getAsync(`INSTRUMENT:${doc.name_futures}:DEPTH:ASKS`);
    let cacheDocBids = await redis.getAsync(`INSTRUMENT:${doc.name_futures}:DEPTH:BIDS`);

    if (!cacheDocAsks) {
      cacheDocAsks = [];
    } else {
      cacheDocAsks = JSON.parse(cacheDocAsks);
    }

    if (!cacheDocBids) {
      cacheDocBids = [];
    } else {
      cacheDocBids = JSON.parse(cacheDocBids);
    }

    doc.asks = cacheDocAsks;
    doc.bids = cacheDocBids;
    doc.averageVolume = 100;
  }));

  return res.json({
    status: true,
    result: validDocs,
  });
};
