const ATR = require('technicalindicators').ATR;

const log = require('../../../libs/logger');

const calculateSuperTrend = ({
  data,
  factor,
  atrPeriod,
}) => {
  if (!factor) {
    log.warn('No factor');
    return false;
  }

  if (!atrPeriod) {
    log.warn('No atrPeriod');
    return false;
  }

  if (!data || !data.length) {
    log.warn('No or empty data');
    return false;
  }

  const dataForCalculate = {
    high: [],
    low: [],
    close: [],
    period: atrPeriod,
  };

  data.forEach(candle => {
    dataForCalculate.low.push(candle.low);
    dataForCalculate.high.push(candle.high);
    dataForCalculate.close.push(candle.close);
  });

  const arrAtr = ATR.calculate(dataForCalculate);

  data.forEach((candle, index) => {
    if (index < atrPeriod) {
      return true;
    }

    const hl2 = (candle.high + candle.low) / 2;
    const prevData = data[index - 1];
    const atr = arrAtr[index - atrPeriod];

    let topBand = hl2 + (factor * atr);
    let bottomBand = hl2 - (factor * atr);

    const prevAtr = prevData.atr;
    const prevClose = prevData.close;
    const prevTopBand = prevData.topBand || 0;
    const prevBottomBand = prevData.bottomBand || 0;
    const prevSuperTrend = prevData.superTrend || 0;

    topBand = (topBand < prevTopBand || prevClose > prevTopBand) ? topBand : prevTopBand;
    bottomBand = (bottomBand > prevBottomBand || prevClose < prevBottomBand) ? bottomBand : prevBottomBand;

    let direction = 0;
    let superTrend = 0;

    if (!prevAtr || Number.isNaN(prevAtr)) {
      direction = 1;
    } else if (prevSuperTrend === prevTopBand) {
      direction = candle.close > topBand ? -1 : 1;
    } else {
      direction = candle.close < bottomBand ? 1 : -1;
    }

    superTrend = direction === -1 ? bottomBand : topBand;

    candle.atr = atr;
    candle.topBand = topBand;
    candle.bottomBand = bottomBand;
    candle.superTrend = superTrend;
    candle.isLong = direction < 0;
  });

  return data;
};

module.exports = {
  calculateSuperTrend,
};
