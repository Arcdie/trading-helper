const jsonwebtoken = require('jsonwebtoken');

const {
  jwtConf,
} = require('../config');

const createToken = data =>
  jsonwebtoken.sign(data, jwtConf.secret, { expiresIn: jwtConf.lifetime });

const verifyToken = token =>
  jsonwebtoken.verify(token, jwtConf.secret);


module.exports = {
  verifyToken,
  createToken,
};
