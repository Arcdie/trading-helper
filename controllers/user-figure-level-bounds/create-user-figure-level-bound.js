const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const log = require('../../libs/logger')(module);

const {
  createUserFigureLevelBound,
} = require('./utils/create-user-figure-level-bound');

const {
  INTERVALS,
} = require('../candles/constants');

const InstrumentNew = require('../../models/InstrumentNew');

module.exports = async (req, res, next) => {
  try {
    const {
      body: {
        instrumentId,
        isModerated,

        levelPrice,
        levelTimeframe,
        levelStartCandleTime,
      },

      user,
    } = req;

    if (!user) {
      return res.json({
        status: false,
        message: 'Not authorized',
      });
    }

    if (!instrumentId || !isMongoId(instrumentId)) {
      return res.json({
        status: false,
        message: 'No or invalid instrumentId',
      });
    }

    if (!levelPrice) {
      return res.json({
        status: false,
        message: 'No levelPrice',
      });
    }

    if (!levelTimeframe || !INTERVALS.get(levelTimeframe)) {
      return res.json({
        status: false,
        message: 'No or invalid levelTimeframe',
      });
    }

    if (!levelStartCandleTime || !moment(levelStartCandleTime).isValid()) {
      return res.json({
        status: false,
        message: 'No or invalid levelStartCandleTime',
      });
    }

    const instrumentDoc = await InstrumentNew.findById(instrumentId, {
      name: 1,
      price: 1,
    });

    if (!instrumentDoc) {
      return {
        status: false,
        message: 'No Instrument',
      };
    }

    const resultCreateBound = await createUserFigureLevelBound({
      userId: user._id,

      instrumentId,
      instrumentName: instrumentDoc.name,
      instrumentPrice: instrumentDoc.price,

      levelPrice,
      levelTimeframe,
      levelStartCandleTime,

      isModerated,
    });

    if (!resultCreateBound || !resultCreateBound.status) {
      return res.json({
        status: false,
        message: resultCreateBound.message || 'Cant createUserFigureLevelBound',
      });
    }

    return res.json({
      status: true,
      result: resultCreateBound.result,
    });
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
