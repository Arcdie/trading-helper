module.exports = async (req, res, next) => {
  const {
    user,
  } = req;

  if (!user) {
    return res.redirect('/');
  }

  res.render('web/experiment-page');
};
