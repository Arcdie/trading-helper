const {
  addFigureLinesToRedis,
} = require('../controllers/user-figure-line-bounds/utils/add-figure-lines-to-redis');

const {
  clearFigureLinesFromRedis,
} = require('../controllers/user-figure-line-bounds/utils/clear-figure-lines-from-redis');

const InstrumentNew = require('../models/InstrumentNew');
const UserFigureLineBound = require('../models/UserFigureLineBound');

module.exports = async () => {
  return;
  console.time('migration');
  console.log('Migration started');

  await clearFigureLinesFromRedis();

  const instrumentsDocs = await InstrumentNew.find({
    is_active: true,
    is_futures: true,
  }).exec();

  if (!instrumentsDocs || !instrumentsDocs.length) {
    return true;
  }

  for await (const doc of instrumentsDocs) {
    console.log('Started', doc.name);

    const activeFigureLines = await UserFigureLineBound.find({
      is_active: true,
      instrument_id: doc._id,
    }).exec();

    if (!activeFigureLines || !activeFigureLines.length) {
      continue;
    }

    const resultAdd = await addFigureLinesToRedis({
      instrumentName: doc.name,
      userId: activeFigureLines[0].user_id.toString(),

      figureLines: activeFigureLines.map(figureLine => ({
        boundId: figureLine._id.toString(),
        priceAngle: figureLine.price_angle,
        lineTimeframe: figureLine.line_timeframe,
        lineStartCandleTime: figureLine.line_start_candle_time,
        lineStartCandleExtremum: figureLine.line_start_candle_extremum,

        isLong: figureLine.is_long,
        isModerated: figureLine.is_moderated,
      })),
    });

    if (!resultAdd || !resultAdd.status) {
      console.log(resultAdd.message || 'Cant addFigureLinesToRedis');
    }
  }

  console.timeEnd('migration');
};
