module.exports = async (req, res, next) => {
  const {
    params: {
      timeframe,
    },
  } = req;

  if (!timeframe || !['5m', '4h'].includes(timeframe)) {
    return next();
  }

  res.render('web/levels-monitoring-page');
};
