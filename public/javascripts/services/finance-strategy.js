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

  sumComission: 3, // $

  stopLossPercent: 2,
  defaultTakeProfitCoefficient: 2, // 1:?
};

class Strategy {
  constructor(params) {
    this.balance = strategyConstants.startBalance;

    this.stockPrice = 0;

    this.stopLoss = 0;
    this.takeProfit = 0;
    this.takeProfitCoefficient = strategyConstants.defaultTakeProfitCoefficient;

    this.startStopLoss = 0;
    this.stepBetweenSLAndTP = 0;

    this.typeGame = 0; // 1: long, 2: short

    this.winBuys = 0;
    this.loseBuys = 0;
  }

  setTypeGame(typeGame) {
    this.typeGame = typeGame;
  }

  setStockPrice(stockPrice) {
    this.stockPrice = stockPrice;
  }

  newBuy({
    typeGame,
    stockPrice,
  }) {
    const {
      stopLossPercent,
    } = strategyConstants;

    this.setStockPrice(stockPrice);
    this.setTypeGame(typeGame);

    this.stocksToBuy = parseInt(this.balance / this.stockPrice, 10);

    if (this.typeGame === 1) {
      this.stopLoss = (
        this.stockPrice - ((this.balance * (stopLossPercent / 100)) / this.stocksToBuy)
      );
    } else {
      this.stopLoss = (
        this.stockPrice + ((this.balance * (stopLossPercent / 100)) / this.stocksToBuy)
      );
    }

    this.stopLoss = Strategy.floatNum(this.stopLoss);
    this.takeProfit = Strategy.floatNum(
      Math.abs(this.stockPrice + ((this.stockPrice - this.stopLoss) * this.takeProfitCoefficient)),
    );

    this.startStopLoss = this.stopLoss;
    this.stepBetweenSLAndTP = Math.abs((this.takeProfit - this.stopLoss) / 2);

    this.balance -= (this.stocksToBuy * this.stockPrice);
    this.balance = Strategy.floatNum(this.balance);

    const copyObj = { ...this };
    console.log('this', copyObj);
  }

  nextStep({
    low,
    high,
    open,
    close,
  }) {

    console.log('high', high);
    const returnResult = {
      isFinish: false,

      // result: 0,
      // isNewTakeProfit: 0,
      // takeProfitCoefficient: 2,
    };

    if (this.typeGame === 1) {
      if (open <= this.stopLoss
        || low <= this.stopLoss) {
        const sumStockPrices = this.stockPrice * this.stocksToBuy;
        const sumToReduce = (open <= this.stopLoss) ? open : this.stopLoss; // if open less than stopLoss (gap)

        console.log('sumToReduce', sumToReduce);

        this.balance += sumStockPrices;

        const differenceBetweenPrices = Math.abs(this.stockPrice - sumToReduce);
        const commonSum = differenceBetweenPrices * this.stocksToBuy;

        if (sumToReduce < this.stockPrice) {
          this.loseBuys += 1;
          this.balance -= commonSum;
          returnResult.result = -commonSum.toFixed(2);

          console.log('loseBuy');
        } else {
          this.winBuys += 1;
          this.balance += commonSum;
          returnResult.result = commonSum.toFixed(2);

          console.log('winBuy, several takeProfits');
        }

        returnResult.isFinish = true;
        returnResult.takeProfitCoefficient = this.takeProfitCoefficient;

        this.setTypeGame(0);
        this.setStockPrice(0);

        this.stopLoss = 0;
        this.takeProfit = 0;
        this.stocksToBuy = 0;
        this.startStopLoss = 0;
        this.takeProfitCoefficient = strategyConstants.defaultTakeProfitCoefficient;

        this.balance = Strategy.floatNum(this.balance);

        this.getInfo();
      } else if (high >= this.takeProfit) {
        const differenceBetweenTPAndHigh = high - this.takeProfit;

        const numberTransfers = Math.ceil(
          differenceBetweenTPAndHigh / this.stepBetweenSLAndTP,
        );

        console.log('differenceBetweenTPAndHigh', differenceBetweenTPAndHigh);

        console.log('numberTransfers', numberTransfers);

        this.takeProfitCoefficient += numberTransfers;
        this.takeProfit = this.startStopLoss + (this.stepBetweenSLAndTP * this.takeProfitCoefficient);
        this.stopLoss = this.takeProfit - this.stepBetweenSLAndTP;

        const copyObj = { ...this };
        console.log('this', copyObj);

        returnResult.isNewTakeProfit = true;
      }
    } else if (this.typeGame === 2) {
      if (open >= this.stopLoss
        || high >= this.stopLoss) {
        const sumStockPrices = this.stockPrice * this.stocksToBuy;
        const sumToReduce = (open >= this.stopLoss) ? open : this.stopLoss; // if open less than stopLoss (gap)

        console.log('sumToReduce', sumToReduce);

        this.balance += sumStockPrices;

        const differenceBetweenPrices = Math.abs(sumToReduce - this.stockPrice);
        const commonSum = differenceBetweenPrices * this.stocksToBuy;

        if (sumToReduce > this.stockPrice) {
          this.loseBuys += 1;
          this.balance -= commonSum;
          returnResult.result = -commonSum.toFixed(2);

          console.log('loseBuy');
        } else {
          this.winBuys += 1;
          this.balance += commonSum;
          returnResult.result = commonSum.toFixed(2);

          console.log('winBuy, several takeProfits');
        }

        returnResult.isFinish = true;
        returnResult.takeProfitCoefficient = this.takeProfitCoefficient;

        this.setTypeGame(0);
        this.setStockPrice(0);

        this.stopLoss = 0;
        this.takeProfit = 0;
        this.stocksToBuy = 0;
        this.startStopLoss = 0;
        this.takeProfitCoefficient = strategyConstants.defaultTakeProfitCoefficient;

        this.balance = Strategy.floatNum(this.balance);

        this.getInfo();
      } else if (low <= this.takeProfit) {
        const differenceBetweenTPAndLow = this.takeProfit - low;

        const numberTransfers = Math.ceil(
          differenceBetweenTPAndLow / this.stepBetweenSLAndTP,
        );

        console.log('differenceBetweenTPAndLow', differenceBetweenTPAndLow);

        console.log('numberTransfers', numberTransfers);

        this.takeProfitCoefficient += numberTransfers;
        this.takeProfit = this.startStopLoss - (this.stepBetweenSLAndTP * this.takeProfitCoefficient);
        this.stopLoss = this.takeProfit + this.stepBetweenSLAndTP;

        const copyObj = { ...this };
        console.log('this', copyObj);

        returnResult.isNewTakeProfit = true;
      }
    }

    return returnResult;
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

  /* deprecated
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
  */
}
