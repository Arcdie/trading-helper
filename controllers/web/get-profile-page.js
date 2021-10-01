module.exports = async (req, res, next) => {
  const {
    user,
  } = req;

  if (!user) {
    return res.redirect('/login');
  }

  res.render('web/profile-page');
};
