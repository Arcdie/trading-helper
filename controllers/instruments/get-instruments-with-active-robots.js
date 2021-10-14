const logger = require('../../libs/logger');

const Instrument = require('../../models/Instrument');

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
    is_active: true,
    does_exist_robot: true,
  }).exec();

  return res.json({
    status: true,
    result: instrumentsDocs.map(doc => doc._doc),
  });
};
