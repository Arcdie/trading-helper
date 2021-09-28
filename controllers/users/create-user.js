const User = require('../../models/User');

module.exports = async (req, res, next) => {
  const {
    body: {
      fullname,
      tradingviewUserId,
      tradingviewChartId,
      tradingviewSessionId,
    },
  } = req;

  if (!fullname) {
    return res.json({
      status: false,
      text: 'No fullname',
    });
  }

  const doesExistUserWithThisName = await User.exists({
    fullname,
  });

  if (doesExistUserWithThisName) {
    return res.json({
      status: false,
      text: 'User with this name already exists',
    });
  }

  const doesExistUserWithThisId = await User.exists({
    tradingview_user_id: tradingviewUserId,
  });

  if (doesExistUserWithThisId) {
    return res.json({
      status: false,
      text: 'User with this id already exists',
    });
  }

  const newUser = new User({
    fullname,
    tradingview_user_id: tradingviewUserId,
    tradingview_chart_id: tradingviewChartId,
    tradingview_session_id: tradingviewSessionId,
  });

  await newUser.save();

  return res.json({
    status: true,
    result: newUser._doc,
  });
};
