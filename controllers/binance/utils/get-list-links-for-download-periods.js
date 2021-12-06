const util = require('util');
const axios = require('axios');
const xml2js = require('xml2js');

const log = require('../../../libs/logger')(module);

xml2js.parseStringPromise = util.promisify(xml2js.parseString);

const getListLinksForDownloadPeriods = async ({
  instrumentName,
}) => {
  try {
    const resultRequest = await axios({
      method: 'get',
      url: `https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/futures/um/monthly/klines/${instrumentName}/5m/`,
    });

    const links = [];

    const parsedXml = await xml2js.parseStringPromise(resultRequest.data);

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
  } catch (error) {
    log.error(error.message);

    return {
      status: false,
      message: error.message,
    };
  }
};

module.exports = {
  getListLinksForDownloadPeriods,
};
