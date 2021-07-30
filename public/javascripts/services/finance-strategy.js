const strategyConstants = {
  startBalance: 1000,

  stopLossPercent: 1,
  takeProfitCoefficient: 2, // 1:?
};

class Strategy {
  constructor(params) {
    this.balance = strategyConstants.startBalance;

    this.stockPrice = 0;
    this.stopLoss = 0;
    this.takeProfit = 0;

    this.typeGame = 0; // 1: long, 2: short

    this.winBuys = 0;
    this.loseBuys = 0;
    this.numberBuys = 0;
  }

  setTypeGame(typeGame) {
    this.typeGame = typeGame;
  }

  setStockPrice(stockPrice) {
    this.stockPrice = stockPrice;
  }

  setStopLoss() {
    const {
      stopLossPercent,
    } = strategyConstants;

    if (this.typeGame === 1) {
      this.stopLoss = this.stockPrice - ((this.balance * (stopLossPercent / 100)) / this.stocksToBuy);
    } else {
      this.stopLoss = this.stockPrice + ((this.balance * (stopLossPercent / 100)) / this.stocksToBuy);
    }

    this.stopLoss = Strategy.floatNum(this.stopLoss);
  }

  setTakeProfit() {
    const {
      takeProfitCoefficient,
    } = strategyConstants;

    this.takeProfit = Math.abs(this.stockPrice + ((this.stockPrice - this.stopLoss) * takeProfitCoefficient));
    this.takeProfit = Strategy.floatNum(this.takeProfit);
  }

  newBuy({
    typeGame,
    stockPrice,
    time,
  }) {
    this.setStockPrice(stockPrice);

    this.stocksToBuy = parseInt(this.balance / this.stockPrice, 10);

    if (this.stocksToBuy === 0) {
      throw new Error('stocksToBuy === 0');
    }

    this.setTypeGame(typeGame);
    this.setStopLoss();
    this.setTakeProfit();

    const oldBalance = this.balance;

    this.balance -= (this.stocksToBuy * this.stockPrice);
    this.balance = Strategy.floatNum(this.balance);
  }

  loseBuy() {
    const sumStockPrices = this.stockPrice * this.stocksToBuy;
    const looses = Math.abs(this.stocksToBuy * (this.stockPrice - this.stopLoss));

    this.balance += (sumStockPrices - looses);
    this.balance = Strategy.floatNum(this.balance);

    this.endBuy(this.stopLoss);
    this.loseBuys += 1;

    if (this.balance <= 0) {
      throw new Error('balance <= 0');
    }
  }

  winBuy() {
    const {
      takeProfitCoefficient,
    } = strategyConstants;

    const sumStockPrices = this.stockPrice * this.stocksToBuy;
    const profit = Math.abs(((this.stockPrice - this.stopLoss) * takeProfitCoefficient) * this.stocksToBuy);

    this.balance = Strategy.floatNum(this.balance + (sumStockPrices + profit));

    this.endBuy(this.takeProfit);
    this.winBuys += 1;
  }

  endBuy(stockPrice) {
    this.setTypeGame(0);
    this.setStopLoss(0);
    this.setTakeProfit(0);

    this.stocksToBuy = 0;
  }

  getInfo() {
    console.log('endBalance', this.balance.toFixed(2));
    console.log('numberBuys', this.loseBuys + this.winBuys);
    console.log('loseBuys', this.loseBuys);
    console.log('winBuys', this.winBuys);
  }

  static floatNum(value) {
    return +(Math.floor(value + 'e+' + 2) + 'e-' + 2);
  }
}
