const moment = require('moment');

const {
  isMongoId,
} = require('validator');

const log = require('../../libs/logger');

const {
  getUnix,
} = require('../../libs/support');

const {
  getCandles,
} = require('../candles/utils/get-candles');

const {
  getActiveInstruments,
} = require('../instruments/utils/get-active-instruments');

const {
  getInstrumentVolumeBounds,
} = require('../instrument-volume-bounds/utils/get-instrument-volume-bounds');

const {
  PERIOD_FOR_COLLECT_SPOT_VOLUME_STATISTICS,

  SPOT_VOLUMES_LIMITERS: {
    LIFETIME,
    DISTANCE,
    NUMBER_TOUCHES,
    STOPLOSS_PERCENT,
    DOES_CONSIDER_BTC_MICRO_TREND,
    DOES_CONSIDER_FUTURES_MICRO_TREND,
  },
} = require('./constants');

const {
  INTERVALS,
} = require('../candles/constants');

module.exports = async (req, res, next) => {
  const {
    query: {
      instrumentId,
    },

    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  if (instrumentId && !isMongoId(instrumentId)) {
    return res.json({
      status: false,
      message: 'Invalid instrumentId',
    });
  }

  let {
    startDate,
    endDate,
  } = req.query;

  if (startDate) {
    if (!moment(startDate).isValid()) {
      return res.json({
        status: false,
        message: 'Invalid startDate',
      });
    }

    startDate = moment(startDate).utc();
  } else {
    // todo: add constant
    startDate = moment().utc()
      .add(-PERIOD_FOR_COLLECT_SPOT_VOLUME_STATISTICS, 'seconds');
  }

  if (endDate) {
    if (!moment(endDate).isValid()) {
      return res.json({
        status: false,
        message: 'Invalid endDate',
      });
    }

    endDate = moment(endDate).utc();
  } else {
    endDate = moment().utc().startOf('hour');
  }

  const spotInstrumentsDocs = [];
  const futuresInstrumentsDocs = [];

  if (instrumentId) {
    // todo: get spot, futures and btc
    // instrumentsIds.push(instrumentId);
  } else {
    const resultGetInstruments = await getActiveInstruments({});

    if (!resultGetInstruments || !resultGetInstruments.status) {
      return res.json({
        status: false,
        message: resultGetInstruments.message || 'Cant getActiveInstruments',
      });
    }

    const instrumentsDocs = resultGetInstruments.result;
    instrumentsDocs.forEach(doc => instrumentsIds.push(doc._id));
  }

  if (!instrumentsIds || !instrumentsIds.length) {
    return res.json({
      status: true,
      result: [],
    });
  }



  return res.json({
    status: true,
  });
};

const calculateTargetCases = async ({
  spotInstrumentId,
  futuresInstrumentId,

  startDate,
  endDate,
}) => {
  const [
    resultGetCandles,
    resultGetBounds,
  ] = await Promise.all(
    getCandles({
      instrumentId,
      startTime: startDate,
      endTime: endDate,
      interval: INTERVALS.get('1m'),
    }),

    getInstrumentVolumeBounds({
      instrumentId,
      startDate,
      endDate,
    }),
  );

  if (!resultGetCandles || !resultGetCandles.status) {
    const message = resultGetCandles.message || 'Cant getCandles';
    log.warn(message);

    return {
      status: false,
      message,
    };
  }

  if (!resultGetBounds || !resultGetBounds.status) {
    const message = resultGetBounds.message || 'Cant getInstrumentVolumeBounds';
    log.warn(message);

    return {
      status: false,
      message,
    };
  }

  const candlesDocs = resultGetCandles.result;
  const instrumentVolumeBounds = resultGetBounds.result;

  if ((!candlesDocs || !candlesDocs.length)
    || (!instrumentVolumeBounds || !instrumentVolumeBounds.length)) {
    return {
      status: true,
      result: [],
    };
  }

  candlesDocs.forEach(doc => {
    const [
      open,
      close,
      low,
      high,
    ] = doc.data;

    doc.open = open;
    doc.close = close;
    doc.low = low;
    doc.high = high;
    doc.time_unix = getUnix(doc.time);

    delete doc.data;
  });

  const targetCases = [];

  const spotDoc = instrumentsDocs.find(doc => doc._id === instrumentId);
  const futuresDoc = instrumentsDocs.find(doc => doc.name === `${spotDoc.name}PERP`);

  instrumentVolumeBounds.forEach(bound => {
    const volumeStartedAtUnix = moment(bound.volume_started_at).utc()
      .startOf('minute').unix();

    const volumeEndedAtUnix = moment(bound.volume_ended_at).utc()
      .endOf('minute').unix() + 1;

    const differenceBetweenEndAndStart = volumeEndedAtUnix - volumeStartedAtUnix;

    if (differenceBetweenEndAndStart < LIFETIME) {
      return true;
    }

    let spotCandlesPeriod = spotDoc.chart_candles.originalData
      .filter(data =>
        data.originalTimeUnix >= volumeStartedAtUnix
        && data.originalTimeUnix <= volumeEndedAtUnix,
      )
      .sort((a, b) => a.originalTimeUnix < b.originalTimeUnix ? -1 : 1);

    const firstSpotCandleUnix = spotCandlesPeriod[0].originalTimeUnix;

    let numberTouches = 0;
    const volumePrice = parseFloat(bound.price);
    let indexCandleWhereWereEnoughTouches = false;
    const lSpotCandlesPeriod = spotCandlesPeriod.length;

    for (let i = 0; i < lSpotCandlesPeriod; i += 1) {
      const { low, high } = spotCandlesPeriod[i];

      const sidePrice = bound.is_ask ? high : low;
      const numberStepsFromBoundPrice = Math.abs(
        Math.ceil((volumePrice - sidePrice) / spotDoc.tick_size),
      );

      if (numberStepsFromBoundPrice <= limiterDistance) {
        numberTouches += 1;

        if (numberTouches === limiterNumberTouches) {
          indexCandleWhereWereEnoughTouches = i;
        }
      }
    }

    if (numberTouches < limiterNumberTouches) {
      return true;
    }

    spotCandlesPeriod = spotCandlesPeriod.slice(
      indexCandleWhereWereEnoughTouches, lSpotCandlesPeriod,
    );

    const tmpArr = [spotCandlesPeriod[0]];
    let firstSpotCandleOfEntrance = spotCandlesPeriod[0];

    if (spotCandlesPeriod[1]) {
      tmpArr.push(spotCandlesPeriod[1]);
    }

    let indexStartFuturesCandle = futuresDoc.chart_candles.originalData.findIndex(
      fData => fData.originalTimeUnix === spotCandlesPeriod[0].originalTimeUnix,
    );

    if (bound.is_ask && spotCandlesPeriod[0].high > volumePrice) {
      if (!spotCandlesPeriod[1]) {
        return true;
      } else {
        indexStartFuturesCandle += 1;
        firstSpotCandleOfEntrance = spotCandlesPeriod[1];
      }
    } else if (!bound.is_ask && spotCandlesPeriod[0].low < volumePrice) {
      if (!spotCandlesPeriod[1]) {
        return true;
      } else {
        indexStartFuturesCandle += 1;
        firstSpotCandleOfEntrance = spotCandlesPeriod[1];
      }
    }

    const startFuturesCandle = futuresDoc.chart_candles.originalData[indexStartFuturesCandle];

    const targetBtcCandle = btcDoc.indicator_micro_supertrend_data
      .find(data => data.originalTimeUnix === startFuturesCandle.originalTimeUnix);

    const targetFuturesCandle = futuresDoc.indicator_micro_supertrend_data
      .find(data => data.originalTimeUnix === startFuturesCandle.originalTimeUnix);

    let isGreenLight = true;

    if (considerBtcMircoTrend) {
      if ((targetBtcCandle.isLong && bound.is_ask)
        || (!targetBtcCandle.isLong && !bound.is_ask)) {
        isGreenLight = false;
      }
    }

    if (considerFuturesMircoTrend) {
      if ((targetFuturesCandle.isLong && bound.is_ask)
        || (!targetFuturesCandle.isLong && !bound.is_ask)) {
        isGreenLight = false;
      }
    }

    if (!isGreenLight) {
      return true;
    }

    targetInstrumentVolumeBounds.push({
      ...bound,

      number_touches: numberTouches,
      volume_ended_at_unix: volumeEndedAtUnix,
      volume_started_at_unix: volumeStartedAtUnix,
      timelife_in_seconds: differenceBetweenEndAndStart,

      // start candle of volume bound
      first_spot_candle_unix_of_bound: firstSpotCandleUnix,

      // start candle where was entrance
      first_spot_candle_unix_of_entrance: firstSpotCandleOfEntrance.originalTimeUnix,
    });
  });
};
