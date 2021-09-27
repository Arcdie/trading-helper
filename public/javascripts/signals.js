/* global */

/* Constants */
const quoteId = '45125591';
const sessionId = 'gwdzlttutjj6fsqrmsdg7xis6iens0mo';

/* JQuery */

/* Settings */

/* Functions */
const getListQuotesData = async () => {
  const response = await fetch(`/signals/quotes?sessionId=${sessionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  return result;
};

const getListInstrumentsData = async () => {
  const response = await fetch(`/signals/instruments?sessionId=${sessionId}&quoteId=${quoteId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  return result;
};

$(document).ready(async () => {
  const result = await getListInstrumentsData();
  console.log(result);
});
