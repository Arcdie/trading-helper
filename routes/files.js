const router = require('express').Router();

const fileControllers = require('../controllers/files');

router.get('/', fileControllers.getFileByName);

module.exports = router;
