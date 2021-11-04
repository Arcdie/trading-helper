const getById = require('./get-by-id');
const getPublicData = require('./get-public-data');

const login = require('./login');
const createUser = require('./create-user');
const updateUser = require('./update-user');

module.exports = {
  getById,
  getPublicData,

  login,
  createUser,
  updateUser,
};
