/* global windows
makeRequest initPopWindow */

/* Constants */

/* JQuery */

/* Functions */

$(document).ready(async () => {
  $('button')
    .on('click', () => {
      const newWindow = window.open('https://ru.tradingview.com/chart/XCMsz22F/', 'Site', 'width=600,height=400');
    });
});
