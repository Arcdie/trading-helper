/* global Konva, moment Stage, Candle, Chart, constants */

const getStocksData = async (name) => {
  const response = await fetch(`/files?name=${name}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  return result;
};

$(document).ready(async () => {
  const {
    windowWidth,
    windowHeight,
    containerDocument,

    candleWidth,
    paddingBetweenCandles,

    fillForFallingCandle,
    strokeForFallingCandle,

    fillForGrowingCandle,
    strokeForGrowingCandle,

    priceHeight, // 15
    priceLineHeight,

    allowedIndents,

    additionalPercentForPrices,
  } = constants;

  let {
    paddingBetweenPrices, // 15
  } = constants;

  constants.containerWidth = containerDocument.width();
  constants.containerHeight = containerDocument.height();

  const stage = new Stage();

  const stocksData = await getStocksData('mu');
  const newCandles = stocksData.data;

  const sortedCandlesByDate = newCandles
    .sort((a, b) => {
      const unixA = moment(a.date).unix();
      const unixB = moment(b.date).unix();

      if (unixA < unixB) {
        return -1;
      } else if (unixA > unixB) {
        return 1;
      }

      return 0;
    });

  let minLow = newCandles[0].low;
  let maxHigh = newCandles[0].high;

  const groupDates = new Konva.Group({
    x: 0,
    y: constants.containerHeight,
  });

  const groupPrices = new Konva.Group({
    x: constants.containerWidth - 30,
    y: 0,
  });

  const groupPriceLine = new Konva.Group({
    x: 0,
    y: 0,
  });

  const groupDateLine = new Konva.Group({
    x: 0,
    y: 0,
  });

  const groupCandles = new Konva.Group({
    x: 0,
    y: 0,
  });

  newCandles.forEach(({ low, high }) => {
    if (low < minLow) {
      minLow = low;
    }

    if (high > maxHigh) {
      maxHigh = high;
    }
  });

  sortedCandlesByDate.forEach((elem, index) => {
    const textDate = new Konva.Text({
      x: 15 + (30 * index),
      y: -30,
      text: moment(elem.date).format('DD'),
      fontSize: 20,
      fontFamily: 'Calibri',
    });

    groupDates.add(textDate);
  });

  const additionalPrice = maxHigh * (additionalPercentForPrices / 100);
  let minLowAndAdditionalPrice = Math.floor(minLow - additionalPrice);

  if (minLowAndAdditionalPrice < 0) {
    minLowAndAdditionalPrice = 0;
  }

  const maxHighAndAdditionalPrice = Math.ceil(maxHigh + additionalPrice);

  const differenceBetweenMaxHighAndMinLow = maxHighAndAdditionalPrice - minLowAndAdditionalPrice;
  let maxPositions = parseInt(constants.containerHeight / (priceHeight + paddingBetweenPrices), 10);

  const choosedIndent = allowedIndents.find(indent => {
    const numberPositions = differenceBetweenMaxHighAndMinLow / indent;

    if (numberPositions < maxPositions) {
      maxPositions = Math.ceil(numberPositions);
      return indent;
    }
  });

  if (!choosedIndent) {
    alert('No indent');
    return false;
  }

  const spaceForPaddings = constants.containerHeight - (maxPositions * priceHeight);
  paddingBetweenPrices = spaceForPaddings / maxPositions;

  const valueForDecrease = choosedIndent;
  let currentPrice = maxHighAndAdditionalPrice;

  for (let i = 0; i < maxPositions; i += 1) {
    const textPrice = new Konva.Text({
      x: -30,
      y: ((priceHeight + paddingBetweenPrices) * i),
      text: `${currentPrice}.00`,
      fontSize: 20,
      fontFamily: 'Calibri',
    });

    groupPrices.add(textPrice);

    currentPrice -= valueForDecrease;
  }

  const linePriceLine = new Konva.Line({
    points: [0, 0, constants.containerWidth - 60, 0],
    stroke: 'gray',
    strokeWidth: 1,
    dash: [5, 5],
  });

  const rectPriceLine = new Konva.Rect({
    // x: constants.containerWidth - 67,
    x: constants.containerWidth - 150,
    y: -(priceLineHeight / 2),
    width: 80,
    height: priceLineHeight,
    fill: 'black',
  });

  const textPriceLine = new Konva.Text({
    // x: constants.containerWidth - 60,
    x: constants.containerWidth - 120,
    y: -9,
    text: '0.00',
    fontSize: 20,
    fontFamily: 'Calibri',
    fill: 'white',
  });

  groupPriceLine.add(linePriceLine);
  groupPriceLine.add(rectPriceLine);
  groupPriceLine.add(textPriceLine);

  const lineDateLine = new Konva.Line({
    points: [0, 0, 0, constants.containerHeight],
    stroke: 'gray',
    strokeWidth: 1,
    dash: [5, 5],
  });

  const rectDateLine = new Konva.Rect({
    x: constants.containerWidth - 67,
    y: -(priceLineHeight / 2),
    width: 80,
    height: priceLineHeight,
    fill: 'black',
  });

  const textDateLine = new Konva.Text({
    x: constants.containerWidth - 60,
    y: -9,
    text: '0.00',
    fontSize: 20,
    fontFamily: 'Calibri',
    fill: 'white',
  });

  groupDateLine.add(lineDateLine);
  groupDateLine.add(rectDateLine);
  groupDateLine.add(textDateLine);

  console.log('maxHighAndAdditionalPrice', maxHighAndAdditionalPrice);

  sortedCandlesByDate.forEach(({
    open,
    close,
  }, index) => {
    const percentForOpen = 100 / (maxHighAndAdditionalPrice / open);
    const percentForClose = 100 / (maxHighAndAdditionalPrice / close);

    console.log('percentForOpen', percentForOpen);

    const valueFromPriceForOpen = constants.containerHeight * (percentForOpen / 100);
    const valueFromPriceForClose = constants.containerHeight * (percentForClose / 100);

    console.log('valueFromPriceForOpen', valueFromPriceForOpen);

    let yForRect;
    let heightForRect;

    if (close > open) {
      yForRect = valueFromPriceForClose;
      heightForRect = (valueFromPriceForClose - valueFromPriceForOpen);
    } else {
      yForRect = valueFromPriceForOpen;
      heightForRect = (valueFromPriceForOpen - valueFromPriceForClose);
    }

    console.log('yForRect - constants.containerHeight', -(yForRect - constants.containerHeight));

    // нужно 76.36, получается 69.32

    const rectCandleBody = new Konva.Rect({
      x: (candleWidth + paddingBetweenCandles) * index,
      y: valueFromPriceForOpen,
      width: candleWidth,
      height: 1,
      // height: heightForRect,
      fill: 'green',
      stroke: 'black',
      strokeWidth: 1,
    });

    /*
    const candleTop = new Konva.Rect({
      x: 140 + (candleWidth / 2),
      y: 140 - (candleHeight / 2),
      width: 1,
      height: 50,
      fill: 'black',
    });

    const candleBottom = new Konva.Rect({
      x: 140 + (candleWidth / 2),
      y: 140 + candleHeight,
      width: 1,
      height: 50,
      fill: 'black',
    });
    */

    groupCandles.add(rectCandleBody);
  });

  console.log(stage.chartLayer);

  stage.chartLayer.add(groupDates);
  stage.chartLayer.add(groupPrices);
  stage.chartLayer.add(groupPriceLine);
  stage.chartLayer.add(groupDateLine);
  stage.chartLayer.add(groupCandles);

  console.log(stage.mainStage);

  stage.mainStage.on('mousemove', () => {
    const {
      y: yPos,
      x: xPos,
    } = stage.mainStage.getPointerPosition();

    console.log('yPos', yPos);

    groupPriceLine.setAttrs({
      y: yPos,
    });

    groupDateLine.setAttrs({
      x: xPos,
    });

    const percent = 100 / (constants.containerHeight / yPos);
    const percentFromPrice = differenceBetweenMaxHighAndMinLow * (percent / 100);

    textPriceLine.setAttrs({
      text: (maxHighAndAdditionalPrice - percentFromPrice).toFixed(2),
    });
  });

  /*
  const tmp = 1 / maxHighAndAdditionalPrice;

  stage.mainStage.on('mousemove', () => {
    const {
      y: yPos,
    } = stage.mainStage.getPointerPosition();

    groupPriceLine.setAttrs({
      y: yPos,
    });

    console.log('yPost', yPos);

    textPriceLine.setAttrs({
      text: (maxHighAndAdditionalPrice - ((yPos * tmp) * 1000)).toFixed(2),
    });
  });
  */





  // const newChart = new Chart(newCandles);
  // stage.addChartToStage({});

  /*
  const newGroup = new Konva.Group({
    x: 140,
    y: 140,
  });

  const candleHeight = 100;

  const candleBody = new Konva.Rect({
    x: 0,
    y: 0,
    width: candleWidth,
    height: candleHeight,
    fill: 'green',
    stroke: 'black',
    strokeWidth: 2,
  });

  const candleTop = new Konva.Rect({
    x: 140 + (candleWidth / 2),
    y: 140 - (candleHeight / 2),
    width: 1,
    height: 50,
    fill: 'black',
  });

  const candleBottom = new Konva.Rect({
    x: 140 + (candleWidth / 2),
    y: 140 + candleHeight,
    width: 1,
    height: 50,
    fill: 'black',
  });

  newGroup.add(candleBody);
  newGroup.add(candleTop);
  newGroup.add(candleBottom);

  newLayer.add(newGroup);
  newStage.add(newLayer);
  */
});
