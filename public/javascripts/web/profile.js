/* global makeRequest, wsClient */

/* Constants */
const userId = $('h1').data('id');

const URL_UPDATE_USER = '/api/users';
const URL_GET_USER_INSTRUMENTS = '/api/tradingview/instruments';
const URL_REMOVE_ALL_LEVELS = '/api/user-level-bounds/remove-all-levels';
const URL_ADD_LEVELS = '/api/user-level-bounds/add-levels-from-tradingview';
const URL_ADD_5M_LEVELS = '/api/user-level-bounds/add-5m-levels-from-tradingview';

/* JQuery */
const $levels = $('.levels');

/* Functions */
wsClient.onmessage = data => {
  const parsedData = JSON.parse(data.data);

  if (parsedData.actionName) {
    switch (parsedData.actionName) {
      case 'newLoadedLevels': {
        $levels.prepend(`<div class="instrument">
          <p>${parsedData.instrumentName}</p>
          <p>К-во уровней <span>${parsedData.countLevels}</span></p>
        </div>`);

        break;
      }

      case 'endOfLoadLevels': {
        $levels.find('p.loading').removeClass('active');
        alert('Уровни загружены');
        break;
      }

      default: break;
    }
  }
};

$(document).ready(() => {
  $('.setting span.to-instruction')
    .on('click', function () {
      const $setting = $(this).parent();
      $setting.toggleClass('active');
    });

  $('#load-levels')
    .on('click', async function () {
      alert('Закройте все вкладки tradingview');

      $(this).parent().remove();
      $levels.find('.instrument').remove();
      $levels.find('p.loading').addClass('active');

      const resultLoad = await makeRequest({
        method: 'POST',
        url: URL_ADD_LEVELS,
      });

      if (!resultLoad || !resultLoad.status) {
        alert(resultLoad.message || 'Couldnt makeRequest URL_ADD_LEVELS');
        return true;
      }
    });

  $('#load-5m-levels')
    .on('click', async function () {
      alert('Закройте все вкладки tradingview');

      $(this).parent().remove();
      $levels.find('.instrument').remove();
      $levels.find('p.loading').addClass('active');

      const resultLoad = await makeRequest({
        method: 'POST',
        url: URL_ADD_5M_LEVELS,
      });

      if (!resultLoad || !resultLoad.status) {
        alert(resultLoad.message || 'Couldnt makeRequest URL_ADD_5M_LEVELS');
        return true;
      }
    });

  $('#remove-all-levels')
    .on('click', async function () {
      $(this).parent().remove();

      const resultRemove = await makeRequest({
        method: 'POST',
        url: URL_REMOVE_ALL_LEVELS,
      });

      if (!resultRemove || !resultRemove.status) {
        alert(resultRemove.message || 'Couldnt makeRequest URL_REMOVE_ALL_LEVELS');
        return true;
      }

      location.reload(true);
    });

  $('#save-profile-settings')
    .on('click', async () => {
      const $indentInPercents = $('#indent-in-percents');

      const indentInPercents = parseFloat($indentInPercents.val());

      let isDataValid = true;

      if (indentInPercents === '' || Number.isNaN(indentInPercents)) {
        isDataValid = false;
        $indentInPercents.addClass('not-valid');
        alert('Empty or invalid indentInPercents field');
      } else {
        $indentInPercents.removeClass('not-valid');
      }

      if (!isDataValid) {
        return true;
      }

      const resultUpdate = await makeRequest({
        method: 'PATCH',
        url: `${URL_UPDATE_USER}/${userId}`,
        body: {
          indentInPercents,
        },
      });

      if (!resultUpdate || !resultUpdate.status) {
        alert(resultUpdate.message || 'Couldnt makeRequest');
        return true;
      }

      alert('Cохранено');
    });

  $('#save-tradingview-settings')
    .on('click', async () => {
      const $userId = $('#userid');
      const $chartId = $('#chartid');
      const $sessionId = $('#sessionid');

      const userIdInTV = $userId.val();
      const chartIdInTV = $chartId.val();
      const sessionIdInTV = $sessionId.val();

      let isDataValid = true;

      if (!userIdInTV || !Number.isInteger(parseInt(userIdInTV, 10))) {
        isDataValid = false;
        $userId.addClass('not-valid');
        alert('Empty or invalid userid field');
      } else {
        $userId.removeClass('not-valid');
      }

      if (!chartIdInTV) {
        isDataValid = false;
        $chartId.addClass('not-valid');
        alert('Empty or invalid chartid field');
      } else {
        $userId.removeClass('not-valid');
      }

      if (!sessionIdInTV) {
        isDataValid = false;
        $sessionId.addClass('not-valid');
        alert('Empty or invalid sessionid field');
      } else {
        $sessionId.removeClass('not-valid');
      }

      if (!isDataValid) {
        return true;
      }

      const resultUpdate = await makeRequest({
        method: 'PATCH',
        url: `${URL_UPDATE_USER}/${userId}`,
        body: {
          tradingviewUserId: userIdInTV,
          tradingviewChartId: chartIdInTV,
          tradingviewSessionId: sessionIdInTV,
        },
      });

      if (!resultUpdate || !resultUpdate.status) {
        alert(resultUpdate.message || 'Couldnt makeRequest');
        return true;
      }

      const {
        tradingview_user_id: tradingviewUserId,
        tradingview_chart_id: tradingviewChartId,
        tradingview_session_id: tradingviewSessionId,
      } = resultUpdate.result;

      if (!tradingviewUserId || !tradingviewChartId || !tradingviewSessionId) {
        alert(resultUpdate.message || 'Something went wrong');
        return true;
      }

      location.reload(true);
    });
});
