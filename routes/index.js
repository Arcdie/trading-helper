const router = require('express').Router();

router.use('/', require('./web'));
router.use('/files', require('./files'));
router.use('/signals', require('./signals'));

module.exports = router;
