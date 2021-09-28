/* global */

/* Constants */
const quoteId = '45125591';
const chartId = 'XCMsz22F';
const userId = '6153026d6d2e2770174075e3';
const sessionId = 'gwdzlttutjj6fsqrmsdg7xis6iens0mo';

const doIHaveToGetInstrumentsFromTV = false;

/* JQuery */

/* Settings */

/* Functions */
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

$(document).ready(async () => {
  let namesOfInstruments = [];

  if (doIHaveToGetInstrumentsFromTV) {
    const resultGetListFromTV = await getListInstrumentsData({
      userId,
    });

    if (resultGetListFromTV && resultGetListFromTV.status) {
      const arrOfNames = resultGetListFromTV.result.map(
        nameOfInstrument => nameOfInstrument.split(':')[1],
      );

      const resultDoExistInstruments = await doExistInstruments({ arrOfNames });

      if (resultDoExistInstruments && resultDoExistInstruments.status) {
        const arrOfInstrumentsIds = resultDoExistInstruments.result.map(
          doc => doc._id.toString(),
        );

        namesOfInstruments = resultDoExistInstruments.result.map(
          doc => doc.name.toString(),
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
      namesOfInstruments = resultGetUserInstrumentBounds.result.map(
        bound => bound.instrument_doc.name.toString(),
      );
    }
  }

  if (namesOfInstruments && namesOfInstruments.length) {
    const resultGetToken = await getTradingviewToken({
      userId,
    });

    if (resultGetToken && resultGetToken.status) {
      const { token } = resultGetToken.result;
    }
  }
});
