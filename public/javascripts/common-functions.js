const makeRequest = async ({
  url, method, body,
}) => {
  if (!url) {
    alert('No url');
    return false;
  }

  if (!method) {
    alert('No method');
    return false;
  }

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
