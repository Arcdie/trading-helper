const log = require('../../libs/logger')(module);

const InstrumentNew = require('../../models/InstrumentNew');

module.exports = async (req, res, next) => {
  try {
    const {
      body: {
        instrumentsIds,
      },

      user,
    } = req;

    if (!user) {
      return res.json({
        status: false,
        message: 'Not authorized',
      });
    }

    if (!instrumentsIds || !Array.isArray(instrumentsIds)) {
      return res.json({
        status: false,
        text: 'No or invalid instrumentsIds',
      });
    }

    const instrumentsDocs = await InstrumentNew.find({
      _id: { $in: instrumentsIds },
    }).exec();

    return res.json({
      status: true,
      result: instrumentsDocs.map(doc => doc._doc),
    });
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
