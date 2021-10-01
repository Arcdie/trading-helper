module.exports = async (req, res, next) => {
  const {
    user,
  } = req;

  if (!user) {
    res.redirect('/auth/login');
  } else {
    res.redirect('/profile');
  }
};
