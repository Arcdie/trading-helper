const log = require('../../libs/logger')(module);

const InstrumentNew = require('../../models/InstrumentNew');

module.exports = async (req, res, next) => {
  try {
    const {
      body: {
        arrOfNames,
      },

      user,
    } = req;

    if (!user) {
      return res.json({
        status: false,
        message: 'Not authorized',
      });
    }

    if (!arrOfNames || !Array.isArray(arrOfNames)) {
      return res.json({
        status: false,
        text: 'No or invalid names',
      });
    }

    const instrumentsDocs = await InstrumentNew.find({
      name: {
        $in: arrOfNames,
      },
    }, {
      name: 1,
      is_active: 1,
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
