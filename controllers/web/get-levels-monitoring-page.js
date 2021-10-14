module.exports = async (req, res, next) => {
  const {
    params: {
      timeframe,
    },
  } = req;

  if (!timeframe) {
    res.render('web/levels-monitoring-page');
  } else {
    res.render(`web/levels-monitoring-${timeframe}-page`);
  }
};
