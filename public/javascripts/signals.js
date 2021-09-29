/* global */

/* Constants */
const quoteId = '45125591';
const chartId = 'XCMsz22F';
const userId = '6153026d6d2e2770174075e3';
const sessionId = 'gwdzlttutjj6fsqrmsdg7xis6iens0mo';

const wsClient = new WebSocket('ws://localhost:8080');

const URL_GET_QUOTES = '/signals/quotes';
const URL_GET_INSTRUMENTS = '/signals/instruments';
const URL_DO_EXIST_INSTRUMENTS = '/instruments/do-exist';
const URL_DO_EXIST_USER_INSTRUMENT_BOUNDS = '/user-instrument-bounds/do-exist';
const URL_GET_USER_INSTRUMENT_BOUNDS = '/user-instrument-bounds';
const URL_GET_TRADINGVIEW_TOKEN = '/tradingview/token';
const URL_GET_TRADINGVIEW_LEVELS = '/tradingview/levels';
const URL_CREATE_USER_LEVEL_BOUNDS = '/user-level-bounds';
const URL_GET_USER_LEVEL_BOUNDS = URL_CREATE_USER_LEVEL_BOUNDS;

const doIHaveToGetLevelsFromTV = false;
const doIHaveToGetInstrumentsFromTV = false;

let userLevelBounds = [];

/* JQuery */
const $container = $('.container');

/* Settings */

/* Functions */

wsClient.onmessage = data => {
  const parsedData = JSON.parse(data.data);

  if (parsedData.actionName) {
    if (parsedData.actionName === 'newPrice') {
      updatePrice(parsedData);
    }
  }
};

const makeRequest = async ({
  url, method, body,
}) => {
  const objRequest = {
    method,

    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body && Object.keys(body).length > 0) {
    objRequest.body = JSON.stringify(body);
  }

  const response = await fetch(url, objRequest);
  const result = await response.json();
  return result;
};

/*
const getListQuotesData = async userId => {
  const response = await fetch(`/signals/quotes?userId=${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  return result;
};

const getListInstrumentsData = async ({
  userId,
}) => {
  const response = await fetch(`/signals/instruments?userId=${userId}&quoteId=${quoteId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  return result;
};
*/

const doExistInstruments = async ({
  arrOfNames,
}) => {
  if (arrOfNames && arrOfNames.length && arrOfNames.length) {
    const response = await fetch('/instruments/do-exist', {
      method: 'post',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({ arrOfNames }),
    });

    const result = await response.json();
    return result;
  }
};

const doExistUserInstrumentBounds = async ({
  userId,
  arrOfInstrumentsIds,
}) => {
  if (arrOfInstrumentsIds && arrOfInstrumentsIds && arrOfInstrumentsIds.length) {
    const response = await fetch('/user-instrument-bounds/do-exist', {
      method: 'post',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        userId,
        arrOfInstrumentsIds,
      }),
    });

    const result = await response.json();
    return result;
  }
};

const getUserInstrumentBounds = async ({
  userId,
}) => {
  const response = await fetch(`/user-instrument-bounds?userId=${userId}`, {
    method: 'get',

    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  return result;
};

const getTradingviewToken = async ({
  userId,
}) => {
  const response = await fetch(`/tradingview/token?userId=${userId}`, {
    method: 'get',

    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  return result;
};

const getTradingviewLevels = async ({
  userId,
  instrumentId,
  jwtToken,
}) => {
  const response = await fetch(`/tradingview/levels?userId=${userId}&instrumentId=${instrumentId}&jwtToken=${jwtToken}`, {
    method: 'get',

    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  return result;
};

const createUserLevelBounds = async ({
  userId,
  instrumentId,
  prices,
}) => {
  const response = await fetch('/user-level-bounds', {
    method: 'post',

    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
      userId,
      instrumentId,
      prices,
    }),
  });

  const result = await response.json();
  return result;
};

const getUserLevelBounds = async ({
  userId,
}) => {
  const response = await fetch(`/user-level-bounds?userId=${userId}`, {
    method: 'get',

    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  return result;
};

$(document).ready(async () => {
  let arrOfInstrumentsIds = [];

  if (doIHaveToGetInstrumentsFromTV) {
    const resultGetListFromTV = await makeRequest({
      method: 'GET',
      url: `${URL_GET_INSTRUMENTS}?userId=${userId}&quoteId=${quoteId}`,
    });

    if (resultGetListFromTV && resultGetListFromTV.status) {
      const arrOfNames = resultGetListFromTV.result.map(
        nameOfInstrument => nameOfInstrument.split(':')[1],
      );

      const resultDoExistInstruments = await doExistInstruments({ arrOfNames });

      if (resultDoExistInstruments && resultDoExistInstruments.status) {
        arrOfInstrumentsIds = resultDoExistInstruments.result.map(
          doc => doc._id.toString(),
        );

        const resultDoExistUserInstrumentBounds = await doExistUserInstrumentBounds({
          userId,
          arrOfInstrumentsIds,
        });
      }
    }
  } else {
    const resultGetUserInstrumentBounds = await getUserInstrumentBounds({
      userId,
    });

    if (resultGetUserInstrumentBounds && resultGetUserInstrumentBounds.status) {
      arrOfInstrumentsIds = resultGetUserInstrumentBounds.result.map(
        bound => bound.instrument_id.toString(),
      );
    }
  }

  if (doIHaveToGetLevelsFromTV &&
    arrOfInstrumentsIds && arrOfInstrumentsIds.length) {
    const resultGetToken = await getTradingviewToken({
      userId,
    });

    if (resultGetToken && resultGetToken.status) {
      const { token } = resultGetToken.result;

      console.log('Started setup levels');

      let indexOfInstrument = 0;
      const lInstrumentsIds = arrOfInstrumentsIds.length;

      const setLevelsInterval = setInterval(async () => {
        if (indexOfInstrument === lInstrumentsIds) {
          return clearInterval(setLevelsInterval);
        }

        const instrumentId = arrOfInstrumentsIds[indexOfInstrument];

        const resultGetLevels = await getTradingviewLevels({
          userId,
          instrumentId,
          jwtToken: token,
        });

        if (resultGetLevels && resultGetLevels.status) {
          const prices = [];

          const {
            payload: {
              sources,
            },
          } = resultGetLevels.result;

          Object.keys(sources).forEach(key => {
            const { points } = sources[key].state;
            points.forEach(point => prices.push(point.price));
          });

          if (prices && prices.length) {
            const resultAddLevels = await createUserLevelBounds({
              userId,
              instrumentId,
              prices,
            });
          }
        }

        indexOfInstrument += 1;
      }, 1000);

      console.log('Ended setup levels');
    }
  }

  const resultGetLevels = await makeRequest({
    method: 'GET',
    url: `${URL_GET_USER_LEVEL_BOUNDS}?userId=${userId}`,
  });

  if (resultGetLevels && resultGetLevels.status) {
    userLevelBounds = resultGetLevels.result || [];

    setInterval(() => {
      renderLevels();
    }, 1000 * 5); // 5 seconds
  }
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
          && innerBound.instrument_doc.name !== bound.instrument_doc.name,
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

    appendStr += `<div class="instrument ${bound.instrument_doc.name}">
      <span class="instrument-name">${bound.instrument_doc.name} (${bound.is_long})</span>
      <div class="levels">
        ${!bound.is_long && instrumentPrice > bound.price_with_indent ? blockWithInstrumentPrice : ''}

        ${bound.is_long ? blockWithOriginalPrice : ''}

        ${bound.is_long
          && instrumentPrice > bound.price_with_indent
          && instrumentPrice < bound.price_original ? blockWithInstrumentPrice : ''}

        ${!hasPriceCrossedIndentPrice ? blockWithIndentPrice : ''}

        ${!bound.is_long
          && instrumentPrice < bound.price_with_indent
          && instrumentPrice > bound.price_original ? blockWithInstrumentPrice : ''}

        ${!bound.is_long ? blockWithOriginalPrice : ''}

        ${bound.is_long && instrumentPrice < bound.price_with_indent ? blockWithInstrumentPrice : ''}
      </div>
    </div>`;
  });

  $container.append(appendStr);
};

const updatePrice = ({ instrumentName, newPrice }) => {
  const targetBounds = userLevelBounds.filter(bound => bound.instrument_doc.name === instrumentName);

  targetBounds.forEach(bound => {
    bound.instrument_doc.price = newPrice;
  });
};

const updatePriceOld = ({ instrumentName, newPrice }) => {
  const $targetLevels = $container.find(`.${instrumentName}`);

  $targetLevels.each((index, targetLevel) => {
    const $targetLevel = $(targetLevel);
    const $levels = $targetLevel.find('.levels');

    let $priceCurrent = $levels.find('p.price_current span.price');
    const $priceOriginal = $levels.find('p.price_original span.price');

    let priceWithIndent = 0;
    let isLong = $targetLevel.hasClass('is_long');

    const priceOriginal = parseFloat($priceOriginal.text());

    if (!$priceCurrent.length) {
      if (priceOriginal < newPrice) {
        isLong = false;
        $targetLevel.addClass('is_short');

        $levels
          .prepend(`<p class="price_current"><span class="price">${newPrice}</span></p>`)
          .find('p.price_minus_indent')
          .remove();

        priceWithIndent = parseFloat($levels
          .find('p.price_plus_indent span.price')
          .text());
      } else {
        isLong = true;
        $targetLevel.addClass('is_long');

        $levels
          .append(`<p class="price_current"><span class="price">${newPrice}</span></p>`)
          .find('p.price_plus_indent')
          .remove();

        priceWithIndent = parseFloat($levels
          .find('p.price_minus_indent span.price')
          .text());
      }

      $priceCurrent = $levels.find('p.price_current span.price');
    } else {
      if (isLong && priceOriginal <= newPrice) {
        $targetLevel.remove();
        return true;
      }

      if (!isLong && priceOriginal >= newPrice) {
        $targetLevel.remove();
        return true;
      }

      if (isLong) {
        priceWithIndent = parseFloat($levels
          .find('p.price_minus_indent span.price')
          .text());
      } else {
        priceWithIndent = parseFloat($levels
          .find('p.price_plus_indent span.price')
          .text());
      }
    }

    $priceCurrent.text(newPrice);

    const differenceBetweenNewPriceAndOriginalPrice = Math.abs(newPrice - priceOriginal);
    const differenceBetweenNewPriceAndOPriceWithIndent = Math.abs(newPrice - priceWithIndent);

    const percentPerOriginalPrice = (100 / (priceOriginal / differenceBetweenNewPriceAndOriginalPrice)).toFixed(2);
    const percentPerPriceWithIndent = (100 / (priceOriginal / differenceBetweenNewPriceAndOPriceWithIndent)).toFixed(2);

    $levels
      .find('p.price_original span.percents')
      .text(`${percentPerOriginalPrice}%`);

    if (isLong) {
      $levels
        .find('p.price_minus_indent span.percents')
        .text(`${percentPerPriceWithIndent}%`);
    } else {
      $levels
        .find('p.price_plus_indent span.percents')
        .text(`${percentPerPriceWithIndent}%`);
    }
  });
};
