const {
  isMongoId,
} = require('validator');

const redis = require('../../libs/redis');
const log = require('../../libs/logger')(module);

const User = require('../../models/User');

module.exports = async (req, res, next) => {
  try {
    const {
      params: {
        userid,
      },

      user,
    } = req;

    let {
      body: {
        tradingviewUserId,
        tradingviewChartId,
        tradingviewSessionId,
      },
    } = req;

    if (!user) {
      return res.json({
        status: false,
        message: 'Not authorized',
      });
    }

    if (!userid || !isMongoId(userid)) {
      return res.json({
        status: false,
        message: 'No or invalid userid',
      });
    }

    if (user._id.toString() !== userid.toString()) {
      return res.json({
        status: false,
        message: 'Access denied',
      });
    }

    if (tradingviewUserId && !Number.isInteger(parseInt(tradingviewUserId, 10))) {
      return res.json({
        status: false,
        message: 'Invalid tradingviewUserId',
      });
    }

    const userDoc = await User.findById(userid, {
      tradingview_user_id: 1,
      tradingview_chart_id: 1,
      tradingview_session_id: 1,
      // tradingview_list_id: 1,
    }).exec();

    if (!userDoc) {
      return res.json({
        status: false,
        message: 'No User',
      });
    }

    if (tradingviewUserId) {
      tradingviewUserId = parseInt(tradingviewUserId, 10);
      userDoc.tradingview_user_id = tradingviewUserId;
    }

    if (tradingviewChartId) {
      tradingviewChartId = tradingviewChartId
        .replace(/\\|\//g, '')
        .trim();

      userDoc.tradingview_chart_id = tradingviewChartId;
    }

    if (tradingviewSessionId) {
      tradingviewSessionId = tradingviewSessionId.trim();
      userDoc.tradingview_session_id = tradingviewSessionId;
    }

    await userDoc.save();

    delete userDoc._doc.password;

    redis.delAsync(`USER:${userDoc._id.toString()}`);

    return res.json({
      status: true,
      result: userDoc._doc,
    });
  } catch (error) {
    log.warn(error.message);

    return res.json({
      status: false,
      message: error.message,
    });
  }
};
