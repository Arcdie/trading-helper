const {
  getActiveInstruments,
} = require('./utils/get-active-instruments');

const logger = require('../../libs/logger');

const InstrumentNew = require('../../models/InstrumentNew');

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

  const resultGetInstruments = await getActiveInstruments();

  if (!resultGetInstruments || !resultGetInstruments.status) {
    return res.json({
      status: false,
      message: resultGetInstruments.message || 'Cant getActiveInstruments',
    });
  }

  return res.json({
    status: true,
    result: resultGetInstruments.result,
  });
};
