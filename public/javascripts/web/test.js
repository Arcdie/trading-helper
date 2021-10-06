/* global windows
makeRequest initPopWindow */

/* Constants */

const URL_GET_SITE = '/api/test/get-site';

/* JQuery */
const $container = $('#container');

/* Functions */

$(document).ready(async () => {
  $('button')
    .on('click', async () => {
      // const newWindow = window.open('https://ru.tradingview.com/chart/XCMsz22F/', 'Site', 'width=600,height=400');
      initPopWindow(windows.getTVChart('LUNAUSDTPERP'));

      /*
      const resultGetSite = await makeRequest({
        method: 'GET',
        url: URL_GET_SITE,
      });

      if (resultGetSite && resultGetSite.status) {
        const replacedHtml = resultGetSite.result
          .replaceAll('src="/static', 'src="https://ru.tradingview.com/static')
          .replaceAll('href="/static', 'href="https://ru.tradingview.com/static')
          .replaceAll('srcset="/static', 'srcset="https://ru.tradingview.com/static');

        $container.html(replacedHtml);
      }
      */
    });
});
