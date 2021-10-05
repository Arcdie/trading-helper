/* global makeRequest, initPopWindow, windows,
  wsClient, tradingviewChartId */

/* Constants */

const URL_GET_USER_LEVEL_BOUNDS = '/api/user-level-bounds';
const URL_ADD_LEVELS = '/api/user-level-bounds/add-levels-from-tradingview-for-one-instrument';
const URL_REMOVE_LEVEL_FOR_INSTRUMENT = '/api/user-level-bounds/remove-level-for-instrument';
const URL_REMOVE_LEVELS_FOR_INSTRUMENT = '/api/user-level-bounds/remove-levels-for-instrument';

let userLevelBounds = [];

const soundNewLevel = new Audio();
soundNewLevel.src = '/audio/new-level.mp3';

/* JQuery */
const $container = $('.container');

/* Functions */
wsClient.onmessage = data => {
  const parsedData = JSON.parse(data.data);

  if (parsedData.actionName) {
    if (parsedData.actionName === 'newPrice') {
      updatePrice(parsedData);
    }
  }
};

$(document).ready(async () => {
  const resultGetLevels = await makeRequest({
    method: 'GET',
    url: URL_GET_USER_LEVEL_BOUNDS,
  });

  if (resultGetLevels && resultGetLevels.status) {
    userLevelBounds = resultGetLevels.result || [];

    userLevelBounds.forEach(bound => {
      bound.is_monitoring = false;
      bound.is_warning_played = false;
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
    .on('mousedown', '.navbar .tradingview-chart', async function (e) {
      const $instrument = $(this).closest('.instrument');

      const instrumentName = $instrument.data('name');

      if (e.button === 0) {
        const newWindow = window.open(`https://ru.tradingview.com/chart/${tradingviewChartId}/?symbol=${instrumentName}`, instrumentName, 'width=600,height=400');
      } else {
        initPopWindow(windows.getTVChart(`BINANCE:${instrumentName}`));
      }
    });
});

const renderLevels = (isFirstRender = false) => {
  userLevelBounds.forEach(bound => {
    const instrumentPrice = bound.instrument_doc.price;

    let priceWithIndent;
    const percentPerOriginalPrice = bound.price_original * (bound.indent_in_percents / 100);

    if (bound.is_long) {
      priceWithIndent = bound.price_original - percentPerOriginalPrice;
    } else {
      priceWithIndent = bound.price_original + percentPerOriginalPrice;
    }

    const differenceBetweenNewPriceAndOriginalPrice = Math.abs(instrumentPrice - bound.price_original);
    const differenceBetweenNewPriceAndOPriceWithIndent = Math.abs(instrumentPrice - priceWithIndent);

    bound.price_with_indent = priceWithIndent;
    bound.price_original_percent = (100 / (bound.price_original / differenceBetweenNewPriceAndOriginalPrice)).toFixed(2);
    bound.price_with_indent_percent = (100 / (bound.price_original / differenceBetweenNewPriceAndOPriceWithIndent)).toFixed(2);

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
      // line crossed level
      userLevelBounds = userLevelBounds.filter(
        innerBound => innerBound.price_original !== bound.price_original
          && innerBound.instrument_doc.name_futures !== bound.instrument_doc.name,
      );

      return true;
    }
  });

  const softBounds = userLevelBounds
    .filter(bound => parseFloat(bound.price_original_percent) <= 3)
    .sort((a, b) => {
      if (parseFloat(a.price_original_percent) < parseFloat(b.price_original_percent)) {
        return -1;
      }

      return 1;
    });

  if (!isFirstRender) {
    softBounds.forEach(bound => {
      if (parseFloat(bound.price_original_percent) <= 1.5
        && !bound.is_warning_played) {
        soundNewLevel.play();
        bound.is_warning_played = true;
      }
    });
  } else {
    softBounds.forEach(bound => {
      if (parseFloat(bound.price_original_percent) <= 1.5) {
        bound.is_warning_played = true;
      }
    });
  }

  $container.empty();

  let appendStr = '';

  softBounds.forEach(bound => {
    const instrumentPrice = bound.instrument_doc.price;

    let hasPriceCrossedIndentPrice = false;

    if (bound.is_long) {
      if (instrumentPrice > bound.price_with_indent
      && instrumentPrice < bound.price_original) {
        hasPriceCrossedIndentPrice = true;
      }
    } else {
      if (instrumentPrice < bound.price_with_indent
      && instrumentPrice > bound.price_original) {
        hasPriceCrossedIndentPrice = true;
      }
    }

    const blockWithOriginalPrice = `<p class="price_original">
      <span class="price">${bound.price_original}</span>
      <span class="percents">${bound.price_original_percent}%</span>
    </p>`;

    const blockWithIndentPrice = `<p class="price_with_indent">
      <span class="price">${parseFloat(bound.price_with_indent.toFixed(2))}</span>
      <span class="percents">${bound.price_with_indent_percent}%</span>
    </p>`;

    const blockWithInstrumentPrice = `<p class="price_current">
      <span class="price">${instrumentPrice}</span></p>`;

    appendStr += `<div class="instrument ${bound.instrument_doc.name_futures} ${bound.is_monitoring ? 'is_monitoring' : ''}" data-instrumentid="${bound.instrument_id}" data-name="${bound.instrument_doc.name_futures}" data-boundid="${bound._id}">
      <span class="instrument-name">${bound.instrument_doc.name_futures} (${bound.is_long ? 'long' : 'short'})</span>
      <div class="levels">
        ${bound.is_long ? blockWithOriginalPrice : ''}

        ${bound.is_long
          && instrumentPrice > bound.price_with_indent
          && instrumentPrice < bound.price_original ? blockWithInstrumentPrice : ''}

        ${!bound.is_long
          && instrumentPrice < bound.price_with_indent
          && instrumentPrice > bound.price_original ? blockWithInstrumentPrice : ''}

        ${!bound.is_long ? blockWithOriginalPrice : ''}

        ${bound.is_long && instrumentPrice < bound.price_with_indent ? blockWithInstrumentPrice : ''}
      </div>

      <div class="navbar">
        <button class="tradingview-chart" title="График в TV">TV</button>
        <button class="remove-level" title="Удалить уровень">x</button>
        <button class="reload-levels" title="Обновить уровни для инструмента">
          <img src="/images/reload.png" alt="reload">
        </button>
      </div>
    </div>`;
  });

  $container.append(appendStr);
};

const updatePrice = ({ instrumentName, newPrice }) => {
  const targetBounds = userLevelBounds.filter(
    bound => bound.instrument_doc.name_futures === instrumentName,
  );

  targetBounds.forEach(bound => {
    bound.instrument_doc.price = newPrice;
  });
};
