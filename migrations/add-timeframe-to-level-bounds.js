const UserLevelBound = require('../models/UserLevelBound');

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  await UserLevelBound.updateMany({}, {
    level_timeframe: '4h',
  });

  console.timeEnd('migration');
};
