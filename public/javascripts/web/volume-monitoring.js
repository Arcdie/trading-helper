/* global makeRequest,
wsClient */

/* Constants */

const URL_GET_INSTRUMENTS_WITH_ROBOTS = '/api/instruments/by-robots';

/* JQuery */

/* Functions */
wsClient.onmessage = data => {
  const parsedData = JSON.parse(data.data);

  console.log(parsedData);
};

$(document).ready(async () => {

});
