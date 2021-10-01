const {
  getUserLevelBounds,
} = require('../user-level-bounds/utils/get-user-level-bounds');

const {
  DEFAULT_INDENT_IN_PERCENTS,
} = require('../user-level-bounds/constants');

module.exports = async (req, res, next) => {
  const {
    user,
  } = req;

  if (!user) {
    return res.redirect('/login');
  }

  let userLevelBounds = [];

  if (user.tradingview_session_id) {
    const resultGetBounds = await getUserLevelBounds({
      userId: user._id,
    });

    if (!resultGetBounds || !resultGetBounds.status) {
      return res.json({
        status: true,
        message: resultGetBounds.message || 'Cant getUserLevelBounds',
      });
    }

    userLevelBounds = resultGetBounds.result;
  }

  res.render('web/profile-page', {
    defaultIndentInPercents: DEFAULT_INDENT_IN_PERCENTS,
    userLevelBounds,
  });
};
