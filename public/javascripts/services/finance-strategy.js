// $.JQuery
const $strategy = $('.strategy');
const $switch = $strategy.find('.switch .slider');
const $balance = $strategy.find('.balance');
const $numberBuys = $strategy.find('.number-buys');
const $winBuys = $strategy.find('.win-buys');
const $loseBuys = $strategy.find('.lose-buys');
const $percentFromStartBalance = $strategy.find('.percent-from-start-balance');

const strategyConstants = {
  startBalance: 1000,

  stopLossPercent: 2,
  takeProfitCoefficient: 3, // 1:?
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

  loseBuy(stockPrice) {
    const sumStockPrices = this.stockPrice * this.stocksToBuy;
    const looses = Math.abs(this.stocksToBuy * (this.stockPrice - this.stopLoss));

    this.balance += (sumStockPrices - looses);
    this.balance = Strategy.floatNum(this.balance);

    const differenceBetweenPrices = Math.abs(stockPrice - this.stockPrice);
    const differenceMultiplyCound = differenceBetweenPrices * this.stocksToBuy;

    this.endBuy();
    this.loseBuys += 1;

    if (this.balance <= 0) {
      throw new Error('balance <= 0');
    }

    return -differenceMultiplyCound;
  }

  winBuy(stockPrice) {
    const {
      takeProfitCoefficient,
    } = strategyConstants;

    const sumStockPrices = this.stockPrice * this.stocksToBuy;
    const profit = Math.abs(((this.stockPrice - this.stopLoss) * takeProfitCoefficient) * this.stocksToBuy);

    this.balance = Strategy.floatNum(this.balance + (sumStockPrices + profit));

    const differenceBetweenPrices = Math.abs(stockPrice - this.stockPrice);
    const differenceMultiplyCound = differenceBetweenPrices * this.stocksToBuy;

    this.endBuy();
    this.winBuys += 1;

    return differenceMultiplyCound;
  }

  manualSell(stockPrice) {
    const sumStockPrices = this.stockPrice * this.stocksToBuy;
    const differenceBetweenPrices = Math.abs(stockPrice - this.stockPrice);
    const differenceForAllStocks = differenceBetweenPrices * this.stocksToBuy;

    let result = 0;

    this.balance += sumStockPrices;

    if (this.typeGame === 1) {
      // win
      if (stockPrice > this.stockPrice) {
        this.balance += differenceForAllStocks;
        result += differenceBetweenPrices;
        this.winBuys += 1;
      } else {
        // lose
        this.balance -= differenceForAllStocks;
        result -= differenceBetweenPrices;
        this.loseBuys += 1;
      }
    } else if (this.typeGame === 2) {
      // win
      if (stockPrice < this.stockPrice) {
        this.balance += differenceForAllStocks;
        result += differenceBetweenPrices;
        this.winBuys += 1;
      } else {
        // lose
        this.balance -= differenceForAllStocks;
        result -= differenceBetweenPrices;
        this.loseBuys += 1;
      }
    }

    const differenceMultiplyCound = result * this.stocksToBuy;

    this.balance = Strategy.floatNum(this.balance);
    this.endBuy();

    return differenceMultiplyCound;
  }

  endBuy() {
    this.setTypeGame(0);
    this.setStopLoss(0);
    this.setTakeProfit(0);

    this.stocksToBuy = 0;
  }

  getInfo() {
    const endBalance = this.balance.toFixed(2);
    const numberBuys = this.loseBuys + this.winBuys;
    const percentFromStartBalance = (100 - (100 / (this.balance / strategyConstants.startBalance))).toFixed(2);

    const {
      loseBuys,
      winBuys,
    } = this;

    console.log('endBalance', endBalance);
    console.log('numberBuys', numberBuys);
    console.log('loseBuys', loseBuys);
    console.log('winBuys', winBuys);
    console.log('percentFromStartBalance', percentFromStartBalance);

    $balance.text(endBalance);
    $numberBuys.text(numberBuys);
    $loseBuys.text(loseBuys);
    $winBuys.text(winBuys);
    $percentFromStartBalance.text(percentFromStartBalance);
  }

  static floatNum(value) {
    return +(Math.floor(value + 'e+' + 2) + 'e-' + 2);
  }
}
