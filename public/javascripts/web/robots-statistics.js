/* global makeRequest */

/* Constants */

const URL_GET_INSTRUMENTS_WITH_ROBOTS = '/api/instruments/by-robots';


/* JQuery */
const $container = $('.container-instruments');

/* Functions */

$(document).ready(async () => {
  const resultGetInstruments = await makeRequest({
    method: 'GET',
    url: URL_GET_INSTRUMENTS_WITH_ROBOTS,
  });

  if (resultGetInstruments && resultGetInstruments.status) {
    let appendStr = '';

    resultGetInstruments.result.forEach(instrument => {
      instrument.tick_sizes_for_robot.forEach(tick => {
        appendStr += `<a
          class="instrument"
          data-tickid="${tick._id}"
          data-instrumentid="${instrument._id}"
          href="/instrument-tick-bounds?instrumentId=${instrument._id}&tickId=${tick._id}"
        >
          <span class="instrument-name">${instrument.name_spot}</span>
          <p><span>Объем: ${tick.value}</span><span>Направление: ${tick.direction}</span></p>
        </a>`;
      });
    });

    $container.append(appendStr);
  }

  $container
    .on('click', '.instrument', function () {
      const $instrument = $(this);

      const tickId = $instrument.data('tickid');
      const instrumentId = $instrument.data('instrumentid');
    });
});
