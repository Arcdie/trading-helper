const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');

const {
  isMongoId,
} = require('validator');

const {
  getListLinksForDownloadPeriods,
} = require('./utils/get-list-links-for-download-periods');

const Instrument = require('../../models/Instrument');

module.exports = async (req, res, next) => {
  const {
    body: {
      instrumentsIds,
    },

    user,
  } = req;

  if (!user) {
    return res.json({
      status: false,
      message: 'Not authorized',
    });
  }

  let instrumentsDocs = [];

  if (instrumentsIds) {
    if (!Array.isArray(instrumentsIds)
      || !instrumentsIds.length) {
      return res.json({
        status: false,
        message: 'Invalid instrumentsIds',
      });
    }

    let areIdsValid = true;

    instrumentsIds.forEach(instrumentId => {
      areIdsValid = isMongoId(instrumentId.toString());

      if (!areIdsValid) {
        return false;
      }
    });

    if (!areIdsValid) {
      return res.json({
        status: false,
        message: 'Invalid instrumentsIds',
      });
    }

    instrumentsDocs = await Instrument.find({
      _id: { $in: instrumentsIds },
    }, {
      name_futures: 1,
    }).exec();
  } else {
    instrumentsDocs = await Instrument.find({
      is_active: true,
    }, {
      name_futures: 1,
    }).exec();
  }

  const namesOfInstruments = instrumentsDocs.map(
    doc => doc.name_futures.replace('PERP', ''),
  );

  const resultGetLinks = await getListLinksForDownloadPeriods({
    instrumentName: namesOfInstruments[0],
  });

  if (!resultGetLinks || !resultGetLinks.status) {
    return res.json({
      status: false,
      message: resultGetLinks.message || 'Cant getListLinksForDownloadPeriods',
    });
  }

  const links = resultGetLinks.result;

  const resultGetFile = await axios({
    method: 'GET',
    url: `https://data.binance.vision/${links[0].link}`,
    responseType: 'stream',
  });

  const zip = new AdmZip(resultGetFile.data);

  const bufferedFile = zip.toBuffer();

  const fileName = `${links[0].link.split('/')[7].split('.')[0]}.csv`;
  const pathToFolder = path.join(__dirname, `../../files/instruments/${namesOfInstruments[0]}PERP`);

  if (!fs.existsSync(pathToFolder)) {
    fs.mkdirSync(pathToFolder);
  }

  fs.writeFileSync(`${pathToFolder}/${fileName}`, bufferedFile);

  return res.json({
    status: true,
  });
};
