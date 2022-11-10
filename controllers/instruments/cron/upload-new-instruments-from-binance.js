const log = require('../../../libs/logger')(module);

const {
  uploadNewInstrumentsFromBinance,
} = require('./utils/upload-new-instruments-from-binance');

module.exports = async (req, res, next) => {
  try {
    const resultUpload = await uploadNewInstrumentsFromBinance();

    if (!resultUpload || !resultUpload.status) {
      return res.json({
        status: false,
        message: resultUpload.message || 'Cant uploadNewInstrumentsFromBinance',
      });
    }

    return res.json({
      status: true,
      result: resultUpload.result,
    });
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
