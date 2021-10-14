const {
  isMongoId,
} = require('validator');

const Instrument = require('../../models/Instrument');

module.exports = async (req, res, next) => {
  const {
    query: {
      tickId,
      instrumentId,
    },

    user,
  } = req;

  if (!user) {
    return res.redirect('/');
  }

  if (!tickId || !isMongoId(tickId)) {
    return res.send('No or invalid tickId');
  }

  if (!instrumentId || !isMongoId(instrumentId)) {
    return res.send('No or invalid instrumentId');
  }

  const instrumentDoc = await Instrument.findById(instrumentId).exec();

  if (!instrumentDoc) {
    return res.send('No Instrument');
  }

  if (!instrumentDoc.is_active) {
    return res.send('Instrument is not active');
  }

  const doesExistTick = instrumentDoc.tick_sizes_for_robot.find(
    tick => tick._id.toString() === tickId.toString(),
  );

  if (!doesExistTick) {
    return res.send('No tick with this id');
  }

  res.render('web/instrument-tick-bounds-page', {
    tickDoc: doesExistTick._doc,
    instrumentDoc: instrumentDoc._doc,
    pageTitle: `Статистика по ${instrumentDoc.name_spot} ${doesExistTick.value} ${doesExistTick.direction}`,
  });
};
