/* global makeRequest,
wsClient */

/* Constants */

const URL_GET_INSTRUMENT_BY_ID = '/api/instruments';
const URL_GET_INSTRUMENT_VOLUME_BOUNDS = '/api/instrument-volume-bounds';

let instrumentsDocs = [];

/* JQuery */
const $container = $('.container');

/* Functions */
wsClient.onmessage = async data => {
  const parsedData = JSON.parse(data.data);

  console.log('actionName', parsedData.actionName);

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
        const {
          _id: boundId,
          instrument_id: instrumentId,

          price,
          is_ask: isAsk,
        } = parsedData.data;

        let instrumentDoc = instrumentsDocs.find(doc => doc._id.toString() === instrumentId);

        if (!instrumentDoc) {
          const resultGetInstrument = await makeRequest({
            method: 'GET',
            url: `${URL_GET_INSTRUMENT_BY_ID}/${instrumentId}`,
          });

          if (!resultGetInstrument || !resultGetInstrument.status) {
            alert(`Cant get instrument by id; instrumentId: ${instrumentId}`);
            break;
          }

          instrumentDoc = resultGetInstrument.result;

          instrumentDoc.asks = [];
          instrumentDoc.bids = [];

          instrumentsDocs.push(instrumentDoc);
        }

        let indexOfElement = 0;

        if (isAsk) {
          instrumentDoc.asks.push(parsedData.data);
          instrumentDoc.asks = instrumentDoc.asks
            .sort((a, b) => {
              if (a.price > b.price) return -1;
              return 1;
            });

          indexOfElement = instrumentDoc.asks.findIndex(
            bound => bound._id.toString() === boundId.toString(),
          );
        } else {
          instrumentDoc.bids.push(parsedData.data);
          instrumentDoc.bids = instrumentDoc.bids
            .sort((a, b) => {
              if (a.price > b.price) return -1;
              return 1;
            });

          indexOfElement = instrumentDoc.bids.findIndex(
            bound => bound._id.toString() === boundId.toString(),
          );
        }

        addNewVolumeToInstrument(parsedData.data, indexOfElement);

        break;
      }

      case 'updateInstrumentVolumeBound': {
        const {
          boundId,

          instrument_doc: {
            _id: instrumentId,
          },

          quantity,
          is_ask: isAsk,
        } = parsedData.data;

        const targetDoc = instrumentsDocs.find(doc => doc._id.toString() === instrumentId);

        if (targetDoc) {
          let targetPrice;

          if (isAsk) {
            targetPrice = targetDoc.asks.find(
              price => price._id.toString() === boundId.toString(),
            );
          } else {
            targetPrice = targetDoc.bids.find(
              price => price._id.toString() === boundId.toString(),
            );
          }

          targetPrice.quantity = quantity;

          const $bound = $(`#bound-${boundId}`);

          const differenceBetweenPriceAndOrder = Math.abs(targetDoc.price - targetPrice.price);
          const percentPerPrice = 100 / (targetDoc.price / differenceBetweenPriceAndOrder);

          $bound.find('.quantity span').text(targetPrice.quantity);
          $bound.find('.price .percent').text(`${percentPerPrice.toFixed(1)}%`);
        }

        break;
      }

      case 'deactivateInstrumentVolumeBound': {
        const {
          _id: boundId,
          instrument_id: instrumentId,

          price,
          isAsk,
        } = parsedData.data;

        const targetDoc = instrumentsDocs.find(doc => doc._id.toString() === instrumentId);

        if (targetDoc) {
          if (isAsk) {
            targetDoc.asks = targetDoc.asks.filter(
              bound => bound._id.toString() !== boundId.toString(),
            );

            $(`#bound-${boundId}`).remove();
          } else {
            targetDoc.bids = targetDoc.bids.filter(
              bound => bound._id.toString() !== boundId.toString(),
            );

            $(`#bound-${boundId}`).remove();
          }

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
  const resultGetBounds = await makeRequest({
    method: 'GET',
    url: URL_GET_INSTRUMENT_VOLUME_BOUNDS,
  });

  if (resultGetBounds && resultGetBounds.status) {
    const instrumentVolumeBounds = resultGetBounds.result;

    const instrumentsIds = [
      ...new Set(instrumentVolumeBounds.map(
        bound => bound.instrument_id,
      )),
    ];

    instrumentsDocs = instrumentsIds.map(
      instrumentId => instrumentVolumeBounds
        .find(bound => bound.instrument_id.toString() === instrumentId)
        .instrument_doc,
    );

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

      addNewInstrument(doc);

      doc.asks.forEach((bound, index) => {
        addNewVolumeToInstrument(bound, index);
      });

      doc.bids.forEach((bound, index) => {
        addNewVolumeToInstrument(bound, index);
      });
    });

    // update prices and calculate percents
    setInterval(updatePrices, 10 * 1000);
  }

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

const addNewVolumeToInstrument = (bound, index) => {
  const $instrument = $(`#instrument-${bound.instrument_id}`);

  const differenceBetweenPriceAndOrder = Math.abs(bound.instrument_doc.price - bound.price);
  const percentPerPrice = 100 / (bound.instrument_doc.price / differenceBetweenPriceAndOrder);

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
