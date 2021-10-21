const {
  isMongoId,
} = require('validator');

const logger = require('../../libs/logger');

const InstrumentNew = require('../../models/InstrumentNew');
const InstrumentVolumeBound = require('../../models/InstrumentVolumeBound');

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

  const instrumentVolumeBounds = await InstrumentVolumeBound.find({
    is_active: true,
  }).exec();

  const instrumentsIds = instrumentVolumeBounds.map(bound => bound.instrument_id);

  const instrumentsDocs = await InstrumentNew.find({
    _id: {
      $in: instrumentsIds,
    },
  }).exec();

  const result = instrumentVolumeBounds.map(bound => {
    const instrumentDoc = instrumentsDocs.find(
      doc => doc._id.toString() === bound.instrument_id.toString(),
    );

    const result = bound._doc;
    result.instrument_doc = instrumentDoc._doc;

    return result;
  });

  return res.json({
    status: true,
    result,
  });
};
