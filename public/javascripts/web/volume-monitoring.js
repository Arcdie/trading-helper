/* global makeRequest, getTimestamp, initPopWindow,
windows, wsClient */

/* Constants */

const URL_GET_ACTIVE_INSTRUMENTS = '/api/instruments/active';
const URL_GET_INSTRUMENT_VOLUME_BOUNDS = '/api/instrument-volume-bounds';

let instrumentsDocs = [];
let nowTimestamp = getTimestamp();

const settings = {
  spot: {
    sortByDistaceToPrice: true,
    sortByLifeTimeVolume: false,
  },

  futures: {
    sortByDistaceToPrice: true,
    sortByLifeTimeVolume: false,
  },
};

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

          const $bound = $(`#bound-${boundId}`);

          const differenceBetweenPriceAndOrder = Math.abs(targetDoc.price - targetBound.price);
          const percentPerPrice = 100 / (targetDoc.price / differenceBetweenPriceAndOrder);

          targetBound.quantity = quantity;
          targetBound.price_original_percent = percentPerPrice;

          $bound.find('.quantity span').text(formatNumberToPretty(targetBound.quantity));
          $bound.find('.price .percent').text(`${percentPerPrice.toFixed(1)}%`);
          recalculateOrderVolume();
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
            targetDoc.is_rendered = false;
          }

          recalculateOrderVolume();
        }

        break;
      }

      case 'updateAverageVolume': {
        const {
          instrumentId,
          averageVolume,
        } = parsedData.data;

        const targetDoc = instrumentsDocs.find(doc => doc._id.toString() === instrumentId);

        if (targetDoc) {
          targetDoc.average_volume = parseInt(averageVolume, 10);

          const $instrument = $(`#instrument-${instrumentId}`);
          $instrument.find('.volume-5m span').text(formatNumberToPretty(targetDoc.average_volume));
        }

        break;
      }

      default: break;
    }
  }
};

$(document).ready(async () => {
  // initPopWindow(windows.getVolumeMonitoringSettings(settings));
  const resultGetInstruments = await makeRequest({
    method: 'GET',
    url: URL_GET_ACTIVE_INSTRUMENTS,
  });

  if (!resultGetInstruments || !resultGetInstruments.status) {
    alert(resultGetInstruments.message || 'Cant URL_GET_ACTIVE_INSTRUMENTS');
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

    [...doc.asks, ...doc.bids].forEach(bound => {
      const differenceBetweenPriceAndOrder = Math.abs(doc.price - bound.price);
      const percentPerPrice = 100 / (doc.price / differenceBetweenPriceAndOrder);

      bound.price_original_percent = percentPerPrice;
      bound.lifetime = parseInt((nowTimestamp - bound.created_at) / 60, 10);
    });
  });

  const docsToRender = instrumentsDocs
    .filter(doc => doc.asks.length || doc.bids.length)
    .sort((a, b) => {
      let minPercentAskA = 100;
      let minPercentBidA = 100;

      let minPercentAskB = 100;
      let minPercentBidB = 100;

      let minPercentAsk = 100;
      let minPercentBid = 100;

      if (a.asks.length) {
        minPercentAskA = a.asks[0].price_original_percent;
      }

      if (a.bids.length) {
        minPercentBidA = a.bids[0].price_original_percent;
      }

      if (b.asks.length) {
        minPercentAskB = b.asks[0].price_original_percent;
      }

      if (b.bids.length) {
        minPercentBidB = b.bids[0].price_original_percent;
      }

      minPercentAsk = minPercentAskA <= minPercentBidA ? minPercentAskA : minPercentBidA;
      minPercentBid = minPercentAskB <= minPercentBidB ? minPercentAskB : minPercentBidB;

      if (minPercentAsk < minPercentBid) {
        return -1;
      }

      return 1;
    })
    .forEach((doc, index) => {
      doc.is_rendered = true;
      doc.index_order = index;

      addNewInstrument(doc);

      doc.asks.forEach((bound, index) => {
        addNewVolumeToInstrument(doc, bound, index);
      });

      doc.bids.forEach((bound, index) => {
        addNewVolumeToInstrument(doc, bound, index);
      });
    });

  // update prices and calculate percents
  setInterval(updatePrices, 10 * 1000);

  // update bounds lifetime
  setInterval(() => updateLifetimes, 60 * 1000); // 1 minute

  // update timestampt
  setInterval(() => { nowTimestamp = getTimestamp(); }, 1000);

  $container
    .on('click', 'span.instrument-name', function () {
      const $instrument = $(this).closest('.instrument');

      const instrumentId = $instrument.data('instrumentid');
      const targetDoc = instrumentsDocs.find(doc => doc._id.toString() === instrumentId);

      if (targetDoc.is_monitoring) {
        targetDoc.is_monitoring = false;
        $instrument.removeClass('is_monitoring');
      } else {
        targetDoc.is_monitoring = true;
        $instrument.addClass('is_monitoring');
      }

      recalculateOrderVolume();
    });

  $('.settings')
    .on('click', () => {
      initPopWindow(windows.getVolumeMonitoringSettings(settings));
    });
});

const addNewInstrument = (instrumentDoc) => {
  const volumeContainer = instrumentDoc.is_futures ? 'futures' : 'spot';

  $(`#${volumeContainer} .container`).append(`<div
    class="instrument"
    id="instrument-${instrumentDoc._id}"
    data-instrumentid="${instrumentDoc._id}"
    style="order: ${instrumentDoc.index_order || instrumentsDocs.length}"
  >
    <span class="instrument-name">${instrumentDoc.name}</span>

    <div class="asks"></div>
    <div class="instrument-price"><span>${instrumentDoc.price}</span></div>
    <div class="bids"></div>

    <div class="volume-5m">Объем: <span>${formatNumberToPretty(parseInt(instrumentDoc.average_volume, 10))}</span></div>
  </div>`);
};

const addNewVolumeToInstrument = (instrument, bound, index) => {
  const $instrument = $(`#instrument-${instrument._id}`);

  const blockWithLevel = `<div
    class="level"
    id="bound-${bound._id}"
  >
    <div class="quantity"><span>${formatNumberToPretty(bound.quantity)}</span></div>
    <div class="lifetime"><span>${bound.lifetime}m</span></div>
    <div class="price"><span class="price_original">${bound.price}</span><span class="percent">${bound.price_original_percent.toFixed(1)}%</span></div>
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

const updateLifetimes = () => {
  instrumentsDocs.forEach(doc => {
    [...doc.asks, ...doc.bids].forEach(bound => {
      bound.lifetime = parseInt((nowTimestamp - bound.created_at) / 60, 10);
      $(`#bound-${bound._id} .lifetime span`).text(`${bound.lifetime}m`);
    });
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

  if (!instrumentDoc.is_rendered) {
    addNewInstrument(instrumentDoc);
    instrumentDoc.is_rendered = true;
  }

  let indexOfElement = 0;

  const differenceBetweenPriceAndOrder = Math.abs(instrumentDoc.price - newBound.price);
  const percentPerPrice = 100 / (instrumentDoc.price / differenceBetweenPriceAndOrder);

  newBound.price_original_percent = percentPerPrice;
  newBound.lifetime = parseInt((nowTimestamp - newBound.created_at) / 60, 10);

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

const recalculateOrderVolume = () => {
  let indexOrder = 1;

  const favoriteDocs = instrumentsDocs
    .filter(doc => doc.is_monitoring)
    .forEach(doc => {
      if (doc.index_order !== indexOrder) {
        doc.index_order = indexOrder;
        const $instrument = $(`#instrument-${doc._id}`);
        $instrument.css('order', indexOrder);
      }

      indexOrder += 1;
    });

  const renderedDocs = instrumentsDocs
    .filter(doc => doc.is_rendered && !doc.is_monitoring)
    .sort((a, b) => {
      let minPercentAskA = 100;
      let minPercentBidA = 100;

      let minPercentAskB = 100;
      let minPercentBidB = 100;

      let minPercentAsk = 100;
      let minPercentBid = 100;

      if (a.asks.length) {
        minPercentAskA = a.asks[0].price_original_percent;
      }

      if (a.bids.length) {
        minPercentBidA = a.bids[0].price_original_percent;
      }

      if (b.asks.length) {
        minPercentAskB = b.asks[0].price_original_percent;
      }

      if (b.bids.length) {
        minPercentBidB = b.bids[0].price_original_percent;
      }

      minPercentAsk = minPercentAskA <= minPercentBidA ? minPercentAskA : minPercentBidA;
      minPercentBid = minPercentAskB <= minPercentBidB ? minPercentAskB : minPercentBidB;

      if (minPercentAsk < minPercentBid) {
        return -1;
      }

      return 1;
    })
    .forEach(doc => {
      if (doc.index_order !== indexOrder) {
        const $instrument = $(`#instrument-${doc._id}`);
        $instrument.css('order', indexOrder);
      }

      indexOrder += 1;
    });
};

const formatNumberToPretty = n => {
  if (n < 1e3) return n;
  if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + 'K';
  if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + 'M';
  if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + 'B';
  if (n >= 1e12) return +(n / 1e12).toFixed(1) + 'T';
};
