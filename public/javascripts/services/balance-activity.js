class BalanceActivity {
  constructor({
    balance,
    sumComission,
    stopLossPercent,
    takeProfitCoefficient,
    defaultTypeGame,
  }) {
    this.balance = balance;
    this.sumComission = sumComission;
    this.stopLossPercent = stopLossPercent;
    this.defaultTakeProfitCoefficient = takeProfitCoefficient;

    this.stockPrice = 0;
    this.stocksToBuy = 0;

    this.stopLoss = 0;
    this.takeProfitCoefficient = this.defaultTakeProfitCoefficient;
    this.takeProfit = 0;
    this.breakeven = 0;

    this.startStopLoss = 0;
    this.stepBetweenSLAndTP = 0;

    this.startBalance = this.balance;

    this.typeGame = defaultTypeGame; // 1: long, 2: short

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
    stopLoss,
    stocksToBuy,

    stockPrice,
  }) {
    this.setStockPrice(stockPrice);
    this.setTypeGame(typeGame);

    this.breakeven = this.stockPrice;

    if (stocksToBuy) {
      this.stocksToBuy = stocksToBuy;
    } else {
      this.stocksToBuy = parseInt(this.balance / this.stockPrice, 10);
    }

    if (stopLoss) {
      this.stopLoss = stopLoss;
    } else {
      if (this.typeGame === 1) {
        this.stopLoss = (
          this.stockPrice - ((this.balance * (this.stopLossPercent / 100)) / this.stocksToBuy)
        );
      } else {
        this.stopLoss = (
          this.stockPrice + ((this.balance * (this.stopLossPercent / 100)) / this.stocksToBuy)
        );
      }

      this.stopLoss = BalanceActivity.floatNum(this.stopLoss);
    }

    this.takeProfit = BalanceActivity.floatNum(
      Math.abs(this.stockPrice + ((this.stockPrice - this.stopLoss) * this.defaultTakeProfitCoefficient)),
    );

    this.startStopLoss = this.stopLoss;
    this.stepBetweenSLAndTP = Math.abs((this.takeProfit - this.stopLoss) / 2);

    if (this.typeGame === 1) {
      this.nextTakeProfit = BalanceActivity.floatNum(this.takeProfit + this.stepBetweenSLAndTP);
    } else {
      this.nextTakeProfit = BalanceActivity.floatNum(this.takeProfit - this.stepBetweenSLAndTP);
    }

    this.balance -= (this.stocksToBuy * this.stockPrice);
    this.balance = BalanceActivity.floatNum(this.balance);
  }

  manualSell({
    low,
    high,
    open,
    close,
  }) {
    const returnResult = {
      isFinish: true,

      // result: 0,
      // isNewTakeProfit: 0,
      // takeProfitCoefficient: 2,
    };

    if (this.typeGame === 1) {
      const sumStockPrices = this.stockPrice * this.stocksToBuy;
      const sumToReduce = close;

      this.balance += sumStockPrices;

      const differenceBetweenPrices = Math.abs(this.stockPrice - sumToReduce);
      const commonSum = differenceBetweenPrices * this.stocksToBuy;

      if (sumToReduce < this.stockPrice) {
        this.loseBuys += 1;
        this.balance -= commonSum;
        returnResult.result = -commonSum.toFixed(2);
      } else {
        this.winBuys += 1;
        this.balance += commonSum;
        returnResult.result = commonSum.toFixed(2);
      }
    } else if (this.typeGame === 2) {
      const sumStockPrices = this.stockPrice * this.stocksToBuy;
      const sumToReduce = close;

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
    }

    returnResult.takeProfitCoefficient = this.takeProfitCoefficient;

    this.setTypeGame(0);
    this.setStockPrice(0);

    this.stopLoss = 0;
    this.takeProfit = 0;
    this.nextTakeProfit = 0;
    this.stocksToBuy = 0;
    this.startStopLoss = 0;
    this.takeProfitCoefficient = this.defaultTakeProfitCoefficient;

    this.balance = BalanceActivity.floatNum(this.balance);

    // this.getInfo();

    return returnResult;
  }

  nextStep({
    low,
    high,
    open,
    close,
  }) {
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
        this.nextTakeProfit = 0;
        this.stocksToBuy = 0;
        this.startStopLoss = 0;
        this.takeProfitCoefficient = this.defaultTakeProfitCoefficient;

        this.balance = BalanceActivity.floatNum(this.balance);

        // this.getInfo();
      } else if (high >= this.takeProfit) {
        const differenceBetweenTPAndHigh = high - this.takeProfit;

        const numberTransfers = Math.ceil(
          differenceBetweenTPAndHigh / this.stepBetweenSLAndTP,
        );

        console.log('differenceBetweenTPAndHigh', differenceBetweenTPAndHigh);

        console.log('numberTransfers', numberTransfers);

        this.takeProfitCoefficient += numberTransfers;
        this.takeProfit = this.startStopLoss + (this.stepBetweenSLAndTP * this.takeProfitCoefficient);
        // this.stopLoss = this.takeProfit - this.stepBetweenSLAndTP;

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
        this.nextTakeProfit = 0;
        this.stocksToBuy = 0;
        this.startStopLoss = 0;
        this.takeProfitCoefficient = this.defaultTakeProfitCoefficient;

        this.balance = BalanceActivity.floatNum(this.balance);

        // this.getInfo();
      } else if (low <= this.takeProfit) {
        const differenceBetweenTPAndLow = this.takeProfit - low;

        const numberTransfers = Math.ceil(
          differenceBetweenTPAndLow / this.stepBetweenSLAndTP,
        );

        console.log('differenceBetweenTPAndLow', differenceBetweenTPAndLow);

        console.log('numberTransfers', numberTransfers);

        this.takeProfitCoefficient += numberTransfers;
        this.takeProfit = this.startStopLoss - (this.stepBetweenSLAndTP * this.takeProfitCoefficient);
        // this.stopLoss = this.takeProfit + this.stepBetweenSLAndTP;

        returnResult.isNewTakeProfit = true;
      }
    }

    return returnResult;
  }

  getInfo() {
    const endBalance = this.balance.toFixed(2);
    const numberBuys = this.loseBuys + this.winBuys;

    const differenceBetweenOldBalanceAndNew = parseInt(this.balance - this.startBalance, 10);
    const percentFromStartBalance = (100 / (this.startBalance / differenceBetweenOldBalanceAndNew)).toFixed(2);

    const {
      loseBuys,
      winBuys,
    } = this;

    const percentFromNumberBuys = (100 / (numberBuys / winBuys)).toFixed(2);

    console.log('endBalance', endBalance);
    console.log('numberBuys', numberBuys);
    console.log('loseBuys', loseBuys);
    console.log('winBuys', winBuys);
    console.log('percentFromStartBalance', percentFromStartBalance);
    console.log('percentFromNumberBuys', percentFromNumberBuys);

    return {
      balance: endBalance,
      numberBuys,
      numberLoseBuys: loseBuys,
      numberWinBuys: winBuys,
      percentFromStartBalance,
      percentFromNumberBuys,
    };
  }

  static floatNum(value) {
    return +(Math.floor(value + 'e+' + 2) + 'e-' + 2);
  }
}
