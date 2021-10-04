/* global makeRequest, wsClient, tradingviewChartId */

/* Constants */

const URL_GET_USER_LEVEL_BOUNDS = '/api/user-level-bounds';
const URL_GET_REMOVE_LEVEL = '/api/user-level-bounds/remove-level-for-instrument';

let userLevelBounds = [];

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

    setInterval(() => {
      renderLevels();
    }, 1000 * 5); // 5 seconds
  }

  $container
    .on('click', '.navbar .remove-level', async function () {
      const $instrument = $(this).closest('.instrument');
      const $priceOriginal = $instrument.find('p.price_original span.price');

      const instrumentId = $instrument.data('instrumentid');
      const priceOriginal = parseFloat($priceOriginal.text());

      const resultRemoveLevel = await makeRequest({
        method: 'POST',
        url: URL_GET_REMOVE_LEVEL,

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
    .on('click', '.navbar .tradingview-chart', async function () {
      const $instrument = $(this).closest('.instrument');

      const instrumentName = $instrument.data('name');

      const newWindow = window.open(`https://ru.tradingview.com/chart/${tradingviewChartId}/?symbol=${instrumentName}`, instrumentName, 'width=600,height=400');
    });
});

const renderLevels = () => {
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

    appendStr += `<div class="instrument ${bound.instrument_doc.name_futures}" data-instrumentid="${bound.instrument_id}" data-name="${bound.instrument_doc.name_futures}">
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
