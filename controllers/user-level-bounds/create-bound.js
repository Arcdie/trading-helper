const UserLevelBound = require('../../models/UserLevelBound');

module.exports = async (req, res, next) => {
  const {
    body: {
      name,
    },
  } = req;

  if (!name) {
    return res.json({
      status: false,
      text: 'No name',
    });
  }



  const newInstrument = new Instrument({
    name,
  });

  await newInstrument.save();

  return res.json({
    status: true,
    result: newInstrument._doc,
  });
};
