const doesCandleABullHammer = ({
  low,
  high,
  open,
  close,
}) => {
  /*
    Бычий молот
    Ну такое..
    https://bitstat.top/blog.php?id_n=6651

    const newMarkers = [];
    const targetCandles = [];
    const lData = stocksData.length;

    for (let i = 0; i < lData; i += 1) {
      const result = doesCandleABullHammer(stocksData[i]);

      if (result) {
        newMarkers.push({
          time: stocksData[i].time,
          position: 'belowBar',
          color: '#f68410',
          shape: 'arrowUp',
        });

        targetCandles.push(stocksData[i]);
      }
    }
  */

  const constants = {
    allowedDistanceFromShadow: 3, // %
    maxHighBodyToHighCandle: 33, // %
  };

  const heightCandle = high - low;
  const heightBody = Math.abs(open - close);
  const distanceBetweenOpenAndClose = open - close;

  const howLongBodyFromCandle = 100 / (heightCandle / heightBody);

  if (howLongBodyFromCandle <= constants.maxHighBodyToHighCandle) {
    // Candle is growing
    if (distanceBetweenOpenAndClose < 0) {
      const distanceBetweenCloseAndHigh = high - close;
      const distanceBetweenOpenAndLow = open - low;

      const onWhichDistanceCloseFromHigh = 100 / (heightCandle / distanceBetweenCloseAndHigh);
      const onWhichDistanceOpenFromLow = 100 / (heightCandle / distanceBetweenOpenAndLow); // reverse hammer

      if (
        (onWhichDistanceCloseFromHigh < constants.allowedDistanceFromShadow
        || onWhichDistanceOpenFromLow < constants.allowedDistanceFromShadow)
      ) {
        return true;
      }

      return false;
    } else {
    // Candle is falling
      const distanceBetweenOpenAndHigh = high - open;
      const distanceBetweenCloseAndLow = close - low;

      const onWhichDistanceOpenFromHigh = 100 / (heightCandle / distanceBetweenOpenAndHigh);
      const onWhichDistanceCloseFromLow = 100 / (heightCandle / distanceBetweenCloseAndLow); // reverse hammer

      if (
        (onWhichDistanceOpenFromHigh < constants.allowedDistanceFromShadow
        || onWhichDistanceCloseFromLow < constants.allowedDistanceFromShadow)
      ) {
        return true;
      }
    }
  }

  return false;
};
