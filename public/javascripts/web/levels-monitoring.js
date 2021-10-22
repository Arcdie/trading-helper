/* global makeRequest, initPopWindow, windows,
  wsClient, TradingView */

/* Constants */

const URL_GET_USER_LEVEL_BOUNDS = '/api/user-level-bounds';
const URL_ADD_LEVELS = '/api/user-level-bounds/add-levels-from-tradingview-for-one-instrument';
const URL_REMOVE_LEVEL_FOR_INSTRUMENT = '/api/user-level-bounds/remove-level-for-instrument';
const URL_REMOVE_LEVELS_FOR_INSTRUMENT = '/api/user-level-bounds/remove-levels-for-instrument';

const PERCENT_FOR_SWITCH_ON_NOT_PROCESSING = 1.5;

const TIMEFRAME = location.pathname.split('/')[2];

let userLevelBounds = [];

const soundNewLevel = new Audio();
soundNewLevel.src = '/audio/new-level.mp3';

/* JQuery */
const $container = $('.container');

/* Functions */
wsClient.onmessage = data => {
  const parsedData = JSON.parse(data.data);

  if (parsedData.actionName) {
    if (parsedData.actionName === 'newInstrumentPrice') {
      updatePrice(parsedData.data);
    }
  }
};

$(document).ready(async () => {
  const resultGetLevels = await makeRequest({
    method: 'GET',
    url: `${URL_GET_USER_LEVEL_BOUNDS}?timeframe=${TIMEFRAME}`,
  });

  if (resultGetLevels && resultGetLevels.status) {
    userLevelBounds = resultGetLevels.result || [];

    userLevelBounds.forEach(bound => {
      bound.is_rendered = false;
      bound.is_monitoring = false;
      bound.is_warning_played = false;
      bound.is_active_widget = false;

      const numberSymbolsAfterComma = (bound.instrument_doc.price.toString().split('.')[1] || []).length;
      bound.price_original = parseFloat(bound.price_original.toFixed(numberSymbolsAfterComma));
    });

    renderLevels(true);

    setInterval(() => {
      renderLevels(false);
    }, 1000 * 5); // 5 seconds
  }

  $container
    .on('click', 'span.instrument-name', function () {
      const $instrument = $(this).closest('.instrument');

      const boundId = $instrument.data('boundid');

      $instrument.toggleClass('is_monitoring');

      const targetBound = userLevelBounds.find(
        bound => bound._id.toString() === boundId.toString(),
      );

      if (targetBound) {
        targetBound.is_monitoring = !targetBound.is_monitoring;
      }
    })
    .on('click', '.navbar .remove-level', async function () {
      const $instrument = $(this).closest('.instrument');
      const $priceOriginal = $instrument.find('p.price_original span.price');

      const instrumentId = $instrument.data('instrumentid');
      const priceOriginal = parseFloat($priceOriginal.text());

      const resultRemoveLevel = await makeRequest({
        method: 'POST',
        url: URL_REMOVE_LEVEL_FOR_INSTRUMENT,

        body: {
          instrumentId,
          priceOriginal,
        },
      });

      if (resultRemoveLevel && resultRemoveLevel.status) {
        $instrument.remove();

        userLevelBounds = userLevelBounds.filter(bound =>
          bound.instrumentId !== instrumentId
          && bound.price_original !== priceOriginal,
        );
      }
    })
    .on('click', '.navbar .reload-levels', async function () {
      const $instrument = $(this).closest('.instrument');

      const instrumentId = $instrument.data('instrumentid');

      userLevelBounds = userLevelBounds.filter(bound =>
        bound.instrument_id.toString() !== instrumentId.toString(),
      );

      renderLevels(false);

      const resultRemoveLevels = await makeRequest({
        method: 'POST',
        url: URL_REMOVE_LEVELS_FOR_INSTRUMENT,

        body: {
          instrumentId,
        },
      });

      if (resultRemoveLevels && resultRemoveLevels.status) {
        const resultAddLevels = await makeRequest({
          method: 'POST',
          url: URL_ADD_LEVELS,

          body: {
            instrumentId,
          },
        });

        const resultGetLevels = await makeRequest({
          method: 'GET',
          url: URL_GET_USER_LEVEL_BOUNDS,
        });

        if (resultGetLevels && resultGetLevels.status) {
          const newUserLevelBounds = resultGetLevels.result.filter(bound =>
            bound.instrument_id.toString() === instrumentId.toString(),
          );

          if (newUserLevelBounds && newUserLevelBounds.length) {
            userLevelBounds.push(...newUserLevelBounds);
            renderLevels(false);
          }
        }
      }
    })
    .on('mousedown', '.navbar .tradingview-chart', async function () {
      const $instrument = $(this).closest('.instrument');

      const boundId = $instrument.data('boundid');

      const bound = userLevelBounds.find(
        bound => bound._id.toString() === boundId.toString(),
      );

      if (bound) {
        if (!bound.is_active_widget) {
          bound.is_active_widget = true;
          bound.$element.addClass('extended');

          bound.widget = new TradingView.widget({
            width: `${bound.$element.width()}px`,
            height: 300,
            symbol: bound.instrument_doc.name,
            interval: '5',
            timezone: 'Etc/UTC',
            theme: 'light',
            style: '1',
            locale: 'ru',
            toolbar_bg: '#f1f3f6',
            enable_publishing: false,
            hide_legend: true,
            hide_side_toolbar: false,
            save_image: false,
            container_id: `chart-${bound._id}`,
          });
        } else {
          bound.is_active_widget = false;
          bound.$element.removeClass('extended');
          bound.$element.find('.chart').empty();

          bound.widget = false;
        }
      }
    });
});

const renderLevels = (isFirstRender = false) => {
  userLevelBounds.forEach(bound => {
    const instrumentPrice = bound.instrument_doc.price;

    let hasPriceCrossedOriginalPrice = false;

    if (bound.is_long) {
      if (instrumentPrice >= bound.price_original) {
        hasPriceCrossedOriginalPrice = true;
      }
    } else {
      if (instrumentPrice <= bound.price_original) {
        hasPriceCrossedOriginalPrice = true;
      }
    }

    if (hasPriceCrossedOriginalPrice) {
      bound.is_worked = true;
    }

    let differenceBetweenNewPriceAndOriginalPrice;

    if (bound.is_worked) {
      if (bound.is_long) {
        differenceBetweenNewPriceAndOriginalPrice = bound.price_original - instrumentPrice;
      } else {
        differenceBetweenNewPriceAndOriginalPrice = instrumentPrice - bound.price_original;
      }
    } else {
      differenceBetweenNewPriceAndOriginalPrice = Math.abs(instrumentPrice - bound.price_original);
    }

    bound.price_original_percent =
      parseFloat((100 / (bound.price_original / differenceBetweenNewPriceAndOriginalPrice))
        .toFixed(2));
  });

  const boundsToRemove = userLevelBounds.filter(
    bound => bound.price_original_percent >= 10 && bound.is_rendered,
  );

  const softBounds = userLevelBounds
    .filter(bound => bound.price_original_percent <= 5 && !bound.is_worked)
    .sort((a, b) => {
      if (a.price_original_percent < b.price_original_percent) {
        return -1;
      }

      return 1;
    });


  let indexOrder = 1;

  const workedBounds = userLevelBounds.filter(bound => bound.is_worked);

  if (workedBounds && workedBounds.length) {
    workedBounds.forEach(bound => {
      bound.index_order = indexOrder;
      indexOrder += 1;
    });
  }

  if (softBounds && softBounds.length) {
    softBounds.forEach(bound => {
      bound.index_order = indexOrder;
      indexOrder += 1;
    });
  }

  if (isFirstRender) {
    softBounds.forEach(bound => {
      if (bound.price_original_percent <= PERCENT_FOR_SWITCH_ON_NOT_PROCESSING) {
        bound.is_warning_played = true;
      }
    });
  } else {
    softBounds.forEach(bound => {
      if (bound.price_original_percent <= PERCENT_FOR_SWITCH_ON_NOT_PROCESSING
        && !bound.is_warning_played) {
        // soundNewLevel.play();
        bound.is_warning_played = true;
      }
    });
  }

  let appendStr = '';
  const newRenderedBounds = [];

  [...workedBounds, ...softBounds].forEach(bound => {
    const instrumentPrice = bound.instrument_doc.price;

    const blockWithOriginalPrice = `<p class="price_original">
      <span class="price">${bound.price_original}</span>
      <span class="percents">${bound.price_original_percent}%</span>
    </p>`;

    const blockWithInstrumentPrice = `<p class="price_current">
      <span class="price">${instrumentPrice}</span></p>`;

    if (!bound.is_rendered) {
      let isProcessed = false;
      let isMonitoring = false;
      const isWorked = bound.is_worked;

      if (!isWorked) {
        isMonitoring = bound.is_monitoring;

        if (!isMonitoring) {
          isProcessed = bound.price_original_percent <= PERCENT_FOR_SWITCH_ON_NOT_PROCESSING && !bound.is_monitoring;
        }
      }

      appendStr += `<div
        id="bound-${bound._id}"
        style="order: ${bound.index_order};"
        class="instrument ${bound.instrument_doc.name}
        ${isWorked ? 'is_worked' : ''}
        ${isProcessed ? 'not_processed' : ''}
        ${isMonitoring ? 'is_monitoring' : ''}"
        data-boundid="${bound._id}"
        data-instrumentid="${bound.instrument_id}"
        data-name="${bound.instrument_doc.name}"
      >
        <span class="instrument-name">${bound.instrument_doc.name} (${bound.is_long ? 'long' : 'short'})</span>
        <div class="levels">
          ${!bound.is_long && instrumentPrice > bound.price_original ? blockWithInstrumentPrice : ''}
          ${bound.is_long && instrumentPrice >= bound.price_original && isWorked ? blockWithInstrumentPrice : ''}

          ${blockWithOriginalPrice}

          ${bound.is_long && instrumentPrice < bound.price_original ? blockWithInstrumentPrice : ''}
          ${!bound.is_long && instrumentPrice <= bound.price_original && isWorked ? blockWithInstrumentPrice : ''}

        </div>

        <div class="chart" id="chart-${bound._id}"></div>

        <div class="navbar">
          <button class="tradingview-chart" title="График в TV">TV</button>
          <button class="remove-level" title="Удалить уровень">x</button>
          <button class="reload-levels" title="Обновить уровни для инструмента">
            <img src="/images/reload.png" alt="reload">
          </button>
        </div>
      </div>`;

      newRenderedBounds.push(bound);
    } else {
      bound.$element.css('order', bound.index_order);

      const $blockWithOriginalPrice = bound.$element.find('p.price_original');
      const $blockWithInstrumentPrice = bound.$element.find('p.price_current');

      $blockWithOriginalPrice.find('span.price').text(bound.price_original);
      $blockWithOriginalPrice.find('span.percents').text(`${bound.price_original_percent}%`);

      $blockWithInstrumentPrice.find('span.price').text(bound.instrument_doc.price);

      if (bound.price_original_percent > PERCENT_FOR_SWITCH_ON_NOT_PROCESSING
        && bound.$element.hasClass('not_processed')) {
        bound.$element.removeClass('not_processed');
      }

      if (bound.price_original_percent <= PERCENT_FOR_SWITCH_ON_NOT_PROCESSING
        && !bound.$element.hasClass('not_processed')) {
        bound.$element.addClass('not_processed');
      }

      if (bound.is_worked && !bound.$element.hasClass('is_worked')) {
        bound.$element
          .removeClass('is_monitoring')
          .addClass('is_worked')
          .find('.levels')
          .empty()
          .append(`
          ${bound.is_long && instrumentPrice >= bound.price_original ? blockWithInstrumentPrice : ''}

          ${blockWithOriginalPrice}

          ${!bound.is_long && instrumentPrice <= bound.price_original ? blockWithInstrumentPrice : ''}
        `);
      }
    }
  });

  if (newRenderedBounds && newRenderedBounds.length) {
    $container.append(appendStr);

    newRenderedBounds.forEach(bound => {
      bound.is_rendered = true;
      bound.$element = $(`#bound-${bound._id}`);
    });
  }

  if (boundsToRemove && boundsToRemove.length) {
    boundsToRemove.forEach(bound => {
      bound.is_rendered = false;
      bound.$element.remove();
    });
  }
};

const updatePrice = ({ instrumentName, newPrice }) => {
  const targetBounds = userLevelBounds.filter(
    bound => bound.instrument_doc.name === instrumentName,
  );

  targetBounds.forEach(bound => {
    bound.instrument_doc.price = newPrice;
  });
};
