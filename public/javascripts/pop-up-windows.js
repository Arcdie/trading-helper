const windows = {
  getTVChart(instrumentName) {
    return `<div class="window tv-chart-window">
      <button class="close"></button>
      <iframe src="https://ru.tradingview.com/chart/XCMsz22F/" width="700" height="200" align="left">
         Ваш браузер не поддерживает плавающие фреймы!
      </iframe>
    </div>`;
  },
};
