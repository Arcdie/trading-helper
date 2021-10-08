const util = require('util');
const axios = require('axios');
const xml2js = require('xml2js');

xml2js.parseStringPromise = util.promisify(xml2js.parseString);

const getListLinksForDownloadPeriods = async ({
  instrumentName,
}) => {
  const responseGetPage = await axios({
    method: 'get',
    url: `https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/futures/um/monthly/klines/${instrumentName}/5m/`,
  });

  const links = [];

  const parsedXml = await xml2js.parseStringPromise(responseGetPage.data);

  parsedXml.ListBucketResult.Contents.forEach(content => {
    const {
      Key,
      LastModified,
    } = content;

    if (!Key[0].includes('CHECKSUM')) {
      links.push({
        link: Key[0],
        date: new Date(LastModified[0]),
      });
    }
  });

  return {
    status: true,
    result: links,
  };
};

module.exports = {
  getListLinksForDownloadPeriods,
};
