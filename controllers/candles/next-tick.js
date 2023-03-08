const {
  isMongoId,
} = require('validator');

const log = require('../../libs/logger/index')(module);

const {
  sendData,
} = require('../../websocket/websocket-server');

const {
  ACTION_NAMES,
} = require('../../websocket/constants');

module.exports = async (req, res, next) => {
  try {
    const {
      body: {
        timeUnix,
        instrumentId,
      },

      user,
    } = req;

    if (!user) {
      return res.json({
        status: false,
        message: 'Not authorized',
      });
    }

    if (instrumentId && !isMongoId(instrumentId)) {
      return res.json({
        status: false,
        message: 'Invalid instrumentId',
      });
    }

    if (!timeUnix || !Number.isFinite(timeUnix)) {
      return res.json({
        status: false,
        message: 'Invalid timeUnix',
      });
    }

    sendData({
      actionName: ACTION_NAMES.get('nextTick'),
      data: {
        timeUnix,
        instrumentId,
        userId: user._id,
      },
    });

    return res.json({
      status: true,
    });
  } catch (error) {
    log.error(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
