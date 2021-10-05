const windows = {
  getTVChart(instrumentName) {
    return `<div class="window tv-chart-window">
      <button class="close"></button>

      <div class="tradingview-widget-container">
        <div id="tradingview_532c8"></div>
        <script type="text/javascript">
          new TradingView.widget({
            "width": 980,
            "height": 610,
            "symbol": "${instrumentName}",
            "interval": "5",
            "timezone": "Etc/UTC",
            "theme": "light",
            "style": "1",
            "locale": "ru",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "hide_legend": true,
            "hide_side_toolbar": false,
            "save_image": false,
            "container_id": "tradingview_532c8"
          });
        </script>
      </div>
    </div>`;
  },

  // <iframe src="https://google.com" width="700" height="200" align="left">
  //    Ваш браузер не поддерживает плавающие фреймы!
  // </iframe>
};
