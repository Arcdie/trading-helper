/* global makeRequest,
wsClient */

/* Constants */

const URL_GET_ACTIVE_INSTRUMENTS = '/api/instruments/active';
const URL_GET_INSTRUMENT_VOLUME_BOUNDS = '/api/instrument-volume-bounds';

let instrumentsDocs = [];

/* JQuery */
const $container = $('.container');

/* Functions */
wsClient.onmessage = async data => {
  if (!instrumentsDocs.length) {
    return true;
  }

  const parsedData = JSON.parse(data.data);

  if (parsedData.actionName === 'updateAverageVolume') {
    console.log('actionName', parsedData.actionName);
  }

  if (parsedData.actionName) {
    switch (parsedData.actionName) {
      case 'newInstrumentPrice': {
        const {
          newPrice,
          instrumentName,
        } = parsedData.data;

        const targetDoc = instrumentsDocs.find(doc => doc.name === instrumentName);

        if (targetDoc) {
          targetDoc.price = newPrice;
        }

        break;
      }

      case 'newInstrumentVolumeBound': {
        handlerNewInstrumentVolumeBound(parsedData.data);
        break;
      }

      case 'updateInstrumentVolumeBound': {
        const {
          quantity,
          _id: boundId,
          is_ask: isAsk,
          instrument_id: instrumentId,
        } = parsedData.data;

        const targetDoc = instrumentsDocs.find(doc => doc._id.toString() === instrumentId);

        if (targetDoc) {
          let targetBound;

          if (isAsk) {
            targetBound = targetDoc.asks.find(
              bound => bound._id.toString() === boundId.toString(),
            );
          } else {
            targetBound = targetDoc.bids.find(
              bound => bound._id.toString() === boundId.toString(),
            );
          }

          if (!targetBound) {
            handlerNewInstrumentVolumeBound(parsedData.data);
            break;
          }

          targetBound.quantity = quantity;

          const $bound = $(`#bound-${boundId}`);

          const differenceBetweenPriceAndOrder = Math.abs(targetDoc.price - targetBound.price);
          const percentPerPrice = 100 / (targetDoc.price / differenceBetweenPriceAndOrder);

          $bound.find('.quantity span').text(targetBound.quantity);
          $bound.find('.price .percent').text(`${percentPerPrice.toFixed(1)}%`);
        }

        break;
      }

      case 'deactivateInstrumentVolumeBound': {
        const {
          quantity,
          _id: boundId,
          is_ask: isAsk,
          instrument_id: instrumentId,
        } = parsedData.data;

        const targetDoc = instrumentsDocs.find(doc => doc._id.toString() === instrumentId);

        if (targetDoc) {
          if (isAsk) {
            targetDoc.asks = targetDoc.asks.filter(
              bound => bound._id.toString() !== boundId.toString(),
            );
          } else {
            targetDoc.bids = targetDoc.bids.filter(
              bound => bound._id.toString() !== boundId.toString(),
            );
          }

          $(`#bound-${boundId}`).remove();

          if (!targetDoc.asks.length && !targetDoc.bids.length) {
            instrumentsDocs.filter(
              doc => doc._id.toString() !== instrumentId.toString(),
            );

            $(`#instrument-${instrumentId}`).remove();
          }
        }

        break;
      }

      case 'updateAverageVolume': {
        const {
          instrumentId,
          averageVolumeForLast15Minutes,
        } = parsedData.data;

        const targetDoc = instrumentsDocs.find(doc => doc._id.toString() === instrumentId);

        if (targetDoc) {
          targetDoc.average_volume_for_last_15_minutes = parseInt(averageVolumeForLast15Minutes, 10);

          const $instrument = $(`#instrument-${instrumentId}`);
          $instrument.find('.volume-5m span').text(targetDoc.average_volume_for_last_15_minutes);
        }

        break;
      }

      default: break;
    }
  }
};

$(document).ready(async () => {
  const resultGetInstruments = await makeRequest({
    method: 'GET',
    url: URL_GET_ACTIVE_INSTRUMENTS,
  });

  if (!resultGetInstruments || !resultGetInstruments.status) {
    alert(resultGetBounds.message || 'Cant URL_GET_ACTIVE_INSTRUMENTS');
    return true;
  }

  const resultGetBounds = await makeRequest({
    method: 'GET',
    url: URL_GET_INSTRUMENT_VOLUME_BOUNDS,
  });

  if (!resultGetBounds || !resultGetBounds.status) {
    alert(resultGetBounds.message || 'Cant URL_GET_INSTRUMENT_VOLUME_BOUNDS');
    return true;
  }

  instrumentsDocs = resultGetInstruments.result;
  const instrumentVolumeBounds = resultGetBounds.result;

  instrumentsDocs.forEach(doc => {
    doc.asks = instrumentVolumeBounds
      .filter(bound => bound.instrument_id.toString() === doc._id.toString() && bound.is_ask)
      .sort((a, b) => {
        if (a.price > b.price) {
          return -1;
        }

        return 1;
      });

    doc.bids = instrumentVolumeBounds
      .filter(bound => bound.instrument_id.toString() === doc._id.toString() && !bound.is_ask)
      .sort((a, b) => {
        if (a.price > b.price) {
          return -1;
        }

        return 1;
      });

    if (doc.asks.length || doc.bids.length) {
      addNewInstrument(doc);

      doc.asks.forEach((bound, index) => {
        addNewVolumeToInstrument(doc, bound, index);
      });

      doc.bids.forEach((bound, index) => {
        addNewVolumeToInstrument(doc, bound, index);
      });
    }
  });

  // update prices and calculate percents
  setInterval(updatePrices, 10 * 1000);

  $container
    .on('click', 'span.instrument-name', function () {
      const $instrument = $(this).closest('.instrument');

      $instrument.toggleClass('is_monitoring');
    });
});

const addNewInstrument = (instrumentDoc) => {
  $container.append(`<div class="instrument" id="instrument-${instrumentDoc._id}">
    <span class="instrument-name">${instrumentDoc.name}</span>

    <div class="asks"></div>
    <div class="instrument-price"><span>${instrumentDoc.price}</span></div>
    <div class="bids"></div>

    <div class="volume-5m">5М объем: <span>${parseInt(instrumentDoc.average_volume_for_last_15_minutes, 10)}</span></div>
  </div>`);
};

const addNewVolumeToInstrument = (instrument, bound, index) => {
  const $instrument = $(`#instrument-${instrument._id}`);

  const differenceBetweenPriceAndOrder = Math.abs(instrument.price - bound.price);
  const percentPerPrice = 100 / (instrument.price / differenceBetweenPriceAndOrder);

  const blockWithLevel = `<div
    class="level"
    id="bound-${bound._id}"
  >
    <div class="quantity"><span>${bound.quantity}</span></div>
    <div class="price">
      <span class="price_original">${bound.price}</span><span class="percent">${percentPerPrice.toFixed(1)}%</span>
    </div>
  </div>`;

  if (bound.is_ask) {
    const $asks = $instrument.find('.asks');

    if (index === 0) {
      $asks.prepend(blockWithLevel);
    } else {
      $asks
        .find('.level')
        .eq(index - 1)
        .after(blockWithLevel);
    }
  } else {
    const $bids = $instrument.find('.bids');

    if (index === 0) {
      $bids.prepend(blockWithLevel);
    } else {
      $bids
        .find('.level')
        .eq(index - 1)
        .after(blockWithLevel);
    }
  }
};

const updatePrices = () => {
  instrumentsDocs.forEach(doc => {
    const $instrument = $(`#instrument-${doc._id}`);

    [...doc.asks, ...doc.bids].forEach(bound => {
      const differenceBetweenPriceAndOrder = Math.abs(doc.price - bound.price);
      const percentPerPrice = 100 / (doc.price / differenceBetweenPriceAndOrder);
      $(`#bound-${bound._id} .price .percent`).text(`${percentPerPrice.toFixed(1)}%`);
    });

    $instrument
      .find('.instrument-price span')
      .text(doc.price);
  });
};

const handlerNewInstrumentVolumeBound = (newBound) => {
  const {
    _id: boundId,
    is_ask: isAsk,
    instrument_id: instrumentId,
  } = newBound;

  const instrumentDoc = instrumentsDocs.find(
    doc => doc._id.toString() === instrumentId.toString(),
  );

  if (!instrumentDoc) {
    alert(`No instrument; instrumentId: ${instrumentDoc._id}`);
    return false;
  }

  let indexOfElement = 0;

  if (isAsk) {
    instrumentDoc.asks.push(newBound);
    instrumentDoc.asks = instrumentDoc.asks
      .sort((a, b) => {
        if (a.price > b.price) return -1;
        return 1;
      });

    indexOfElement = instrumentDoc.asks.findIndex(
      bound => bound._id.toString() === boundId.toString(),
    );
  } else {
    instrumentDoc.bids.push(newBound);
    instrumentDoc.bids = instrumentDoc.bids
      .sort((a, b) => {
        if (a.price > b.price) return -1;
        return 1;
      });

    indexOfElement = instrumentDoc.bids.findIndex(
      bound => bound._id.toString() === boundId.toString(),
    );
  }

  addNewVolumeToInstrument(instrumentDoc, newBound, indexOfElement);
};
