const log = require('../../../libs/logger')(module);

const InstrumentNew = require('../../../models/InstrumentNew');

const getActiveInstruments = async ({
  isOnlySpot,
  isOnlyFutures,
  doesExistRobot,
}) => {
  try {
    const matchObj = {
      is_active: true,
    };

    if (isOnlySpot) {
      matchObj.is_futures = false;
    }

    if (isOnlyFutures) {
      matchObj.is_futures = true;
    }

    if (doesExistRobot) {
      matchObj.does_exist_robot = true;
    }

    const instrumentsDocs = await InstrumentNew
      .find(matchObj)
      // .sort({ name: 1 })
      // .limit(5)
      .exec();

    return {
      status: true,
      result: instrumentsDocs.map(doc => doc._doc),
    };
  } catch (error) {
    log.warn(error.message);

    return {
      status: false,
      message: error.message,
    };
  }
};

module.exports = {
  getActiveInstruments,
};
