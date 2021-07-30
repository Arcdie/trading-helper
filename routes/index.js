const router = require('express').Router();

router.use('/', require('./web'));
router.use('/files', require('./files'));

module.exports = router;
