const InstrumentVolumeBound = require('../../models/InstrumentVolumeBound');

module.exports = async (req, res, next) => {
  const {
    query: {
      isOnlyActive,
    },

    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  const matchObj = {};

  if (isOnlyActive) {
    matchObj.is_active = isOnlyActive === 'true';
  }

  const instrumentVolumeBounds = await InstrumentVolumeBound
    .find(matchObj)
    .sort({ time: 1 })
    .exec();

  return res.json({
    status: true,
    result: instrumentVolumeBounds.map(doc => doc._doc),
  });
};
