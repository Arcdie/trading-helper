/*
  Теория: после гэпа, если входить в позицию в сторону гэпа, сколько будет удачных/неудачных.
  Если был гэп, возможно участники рынка знают новость, которая будет и далее влиять на ход цены.

  maxPercent: что считать гэпом?
  distanceBetweenGaps: расстояние до след гэпа
*/

const gapConstants = {
  maxPercent: 5,
};

const getGaps = (data = []) => {
  if (!Array.isArray(data)) {
    console.log('Invalid array');
    return [];
  }

  const returnArr = [];

  data.forEach((currentCandle, index) => {
    const previousCandle = data[index - 1];

    if (!previousCandle) {
      return true;
    }

    if (previousCandle.close !== currentCandle.open) {
      const differenceBetweenCandles = Math.abs(currentCandle.open - previousCandle.close);
      const percentPerPreviousClose = 100 / (previousCandle.close / differenceBetweenCandles);

      if (percentPerPreviousClose >= gapConstants.maxPercent) {
        let typeGame = 0;
        if (currentCandle.open > previousCandle.close) {
          typeGame = 1;
        } else typeGame = 2;

        currentCandle.typeGame = typeGame;

        returnArr.push(currentCandle);
      }
    }
  });

  return returnArr;
};
