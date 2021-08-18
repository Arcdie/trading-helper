const drawSimpleMA = (chart, data) => {
  const constants = {
    period: 50,
    key: 'close',
  };

  const usingData = [];
  const stocksData = [];

  data.forEach((candle, index) => {
    usingData.push(candle.close);

    const currentData = usingData.slice(index - (constants.period - 1));
    const sum = currentData.reduce((i, close) => i + close, 0);
    const average = sum / currentData.length;

    stocksData.push({
      time: candle.time,
      value: average,
    });
  });

  chart.drawSMASeries(stocksData);
};
