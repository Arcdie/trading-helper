const redis = require('../../libs/redis');

const {
  getActiveInstruments,
} = require('../instruments/utils/get-active-instruments');

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

  const resultGetInstruments = await getActiveInstruments({});

  if (!resultGetInstruments || !resultGetInstruments.status) {
    return res.json({
      status: false,
      message: resultGetInstruments.message || 'Cant getActiveInstruments',
    });
  }

  const instrumentVolumeBounds = [];

  const instrumentsDocsWithoutIgnoredVolume = resultGetInstruments.result.filter(
    doc => !doc.does_ignore_volume,
  );

  await Promise.all(instrumentsDocsWithoutIgnoredVolume.map(async doc => {
    const key = `INSTRUMENT:${doc.name}:VOLUME_BOUNDS`;

    const data = await redis.hgetallAsync(key);

    if (data) {
      Object.keys(data).forEach(key => {
        const parsedObj = JSON.parse(data[key]);

        parsedObj.price = key;
        parsedObj.instrument_id = doc._id;
        parsedObj._id = parsedObj.bound_id;

        instrumentVolumeBounds.push(parsedObj);
      });
    }
  }));

  return res.json({
    status: true,
    result: instrumentVolumeBounds,
  });
};
