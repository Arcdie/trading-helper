const UserInstrumentBound = require('../../../models/UserInstrumentBound');

const createBound = async ({
  userId,
  instrumentId,
}) => {
  const doesExistBound = await UserInstrumentBound.exists({
    user_id: userId,
    instrument_id: instrumentId,
  });

  if (doesExistBound) {
    return {
      status: true,
      isCreated: false,
    };
  }

  const newBound = new UserInstrumentBound({
    user_id: userId,
    instrument_id: instrumentId,
  });

  await newBound.save();

  return {
    status: true,
    isCreated: true,
  };
};

module.exports = {
  createBound,
};
