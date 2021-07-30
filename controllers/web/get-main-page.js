const path = require('path');

module.exports = async (req, res, next) => {
  res.sendFile(path.join(__dirname, '../../public/html/index.html'));
};
