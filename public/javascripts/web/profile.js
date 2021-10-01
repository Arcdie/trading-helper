/* global makeRequest */

/* Constants */
const userId = $('h1').data('id');

const URL_UPDATE_USER = '/api/users';
const URL_GET_LISTS = '/api/tradingview/lists';
const URL_FIND_MANY_BY_NAMES = '/api/instruments/by-names';
const URL_GET_USER_INSTRUMENTS = '/api/tradingview/instruments';

/* JQuery */
const $userId = $('#userid');
const $chartId = $('#chartid');
const $sessionId = $('#sessionid');

const $tradingviewLists = $('.settings-for-instruments .tradingview-lists');

/* Functions */

$(document).ready(() => {
  $('.settings-for-tradingview .setting span.to-instruction')
    .on('click', function () {
      const $setting = $(this).parent();
      $setting.toggleClass('active');
    });

  $('#load-lists')
    .on('click', async function () {
      const resultGetLists = await makeRequest({
        method: 'GET',
        url: URL_GET_LISTS,
      });

      if (!resultGetLists || !resultGetLists.status) {
        alert(resultGetLists.message || 'Couldnt makeRequest');
        return true;
      }

      $(this).remove();

      let appendStr = '';

      resultGetLists.result.forEach(list => {
        appendStr += `<li data-listid="${list.id}">
          <button>${list.name}</button>
        </li>`;
      });

      $tradingviewLists.find('ul').append(appendStr);
    });

  $tradingviewLists
    .find('ul')
    .on('click', 'li button', async function () {
      if (confirm('Вы уверены?')) {
        const $list = $(this).parent();
        const listId = $list.data('listid');

        const resultUpdate = await makeRequest({
          method: 'PATCH',
          url: `${URL_UPDATE_USER}/${userId}`,
          body: {
            tradingviewTargetListId: parseInt(listId, 10),
          },
        });

        if (!resultUpdate || !resultUpdate.status) {
          alert(resultUpdate.message || 'Couldnt makeRequest URL_UPDATE_USER');
          return true;
        }

        console.log('listId', listId);

        const resultGetInstruments = await makeRequest({
          method: 'GET',
          url: `${URL_GET_USER_INSTRUMENTS}?userId=${userId}&listId=${listId}`,
        });

        console.log('resultGetInstruments', resultGetInstruments);

        if (!resultGetInstruments || !resultGetInstruments.status) {
          alert(resultUpdate.message || 'Couldnt makeRequest URL_GET_USER_INSTRUMENTS');
          return true;
        }

        const arrOfNames = resultGetInstruments.result.map(
          nameOfInstrument => nameOfInstrument.split(':')[1],
        );

        const resultDoExistInstruments = await makeRequest({
          method: 'POST',
          url: URL_FIND_MANY_BY_NAMES,
          body: {
            arrOfNames,
          },
        });

        if (!resultDoExistInstruments || resultDoExistInstruments.status) {
          alert(resultUpdate.message || 'Couldnt makeRequest URL_FIND_MANY_BY_NAMES');
          return true;
        }

        const inactiveInstruments = arrOfNames.filter(instrumentName => {
          const instrumentDoc = resultDoExistInstruments.result.find(
            doc => doc.name === instrumentName,
          );

          if (!instrumentDoc || !instrumentDoc.is_active) {
            return true;
          }

          return false;
        });

        console.log('inactiveInstruments', inactiveInstruments);
        if (inactiveInstruments && inactiveInstruments.length) {

        }
      }
    });

  $('#save-settings')
    .on('click', async () => {
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
