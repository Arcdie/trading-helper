const redis = require('../../libs/redis');
const log = require('../../libs/logger')(module);

const InstrumentNew = require('../../models/InstrumentNew');
const InstrumentVolumeBound = require('../../models/InstrumentVolumeBound');

module.exports = async (req, res, next) => {
  try {
    const {
      user,
    } = req;

    if (!user) {
      return res.json({
        status: false,
        message: 'Not authorized',
      });
    }

    await InstrumentVolumeBound.deleteMany({}).exec();

    const instrumentsDocs = await InstrumentNew.find({}, { name: 1 }).exec();

    await Promise.all(instrumentsDocs.map(async doc => {
      await redis.delAsync(`INSTRUMENT:${doc.name}:VOLUME_BOUNDS`);
    }));

    return res.json({
      status: true,
    });
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
