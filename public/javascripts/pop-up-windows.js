const windows = {
  getTVChart(instrumentName, containerId = 'tradingview_532c8') {
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
            "container_id": "${containerId}"
          });
        </script>
      </div>
    </div>`;
  },

  getVolumeMonitoringSettings(settings) {
    return `<div class="window volume-monitroing-settings">
      <button class="close"></button>

      <div class="volume-monitroing-settings-container">
        <h2>Spot</h2>
        <div class="spot-settings">
          <ul>
            <li>
              <input type="checkbox" id="spot-direction">
              <label for="spot-direction">Сортировка по % от цены</label>
            <li/>

            <li>
              <input type="checkbox" id="spot-lifetime">
              <label for="spot-lifetime">Сортировка по времени жизни</label>
            <li/>
          </ul>
        </div>

        <h2>Futures</h2>
        <div class="futures-settings">
          <ul>
            <li>
              <input type="checkbox" id="futures-direction">
              <label for="futures-direction">Сортировка по % от цены</label>
            <li/>
            <li>
              <input type="checkbox" id="futures-lifetime">
              <label for="futures-lifetime">Сортировка по времени жизни</label>
            <li/>
          </ul>
        </div>
      </div>
    </div>`;
  },

  // <iframe src="https://google.com" width="700" height="200" align="left">
  //    Ваш браузер не поддерживает плавающие фреймы!
  // </iframe>
};
