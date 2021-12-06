const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const log = require('../../libs/logger')(module);

const InstrumentVolumeBound = require('../../models/InstrumentVolumeBound');

module.exports = async (req, res, next) => {
  try {
    const {
      query: {
        isOnlyActive,
        instrumentId,
        startTime,
        endTime,
      },

      user,
    } = req;

    if (!user) {
      return res.json({
        status: false,
        message: 'Not authorized',
      });
    }

    if (instrumentId && !isMongoId(instrumentId.toString())) {
      return res.json({
        status: false,
        message: 'Invalid instrumentId',
      });
    }

    if (startTime && !moment(startTime).isValid()) {
      return res.json({
        status: false,
        message: 'Invalid startTime',
      });
    }

    if (endTime && !moment(endTime).isValid()) {
      return res.json({
        status: false,
        message: 'Invalid endTime',
      });
    }

    const matchObj = {};

    if (instrumentId) {
      matchObj.instrument_id = instrumentId;
    }

    if (isOnlyActive) {
      matchObj.is_active = isOnlyActive === 'true';
    }

    if (startTime && endTime) {
      const momentStartTime = moment(startTime).utc().startOf('minute');
      const momentEndTime = moment(endTime).utc().startOf('minute');

      matchObj.$and = [{
        volume_started_at: {
          $gt: momentStartTime,
        },
      }, {
        volume_started_at: {
          $lt: momentEndTime,
        },
      }];
    } else if (startTime) {
      const momentStartTime = moment(startTime).utc().startOf('minute');

      matchObj.volume_started_at = {
        $gt: momentStartTime,
      };
    } else if (endTime) {
      const momentEndTime = moment(endTime).utc().startOf('minute');

      matchObj.volume_started_at = {
        $lt: momentEndTime,
      };
    }

    const instrumentVolumeBounds = await InstrumentVolumeBound
      .find(matchObj)
      .sort({ created_at: 1 })
      // .limit(10)
      .exec();

    return res.json({
      status: true,
      result: instrumentVolumeBounds.map(doc => doc._doc),
    });
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
