module.exports = async (req, res, next) => {
  const {
    user,
  } = req;

  return res.redirect('/');
  // res.render('web/experiment-page');
};
