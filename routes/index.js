const router = require('express').Router();

router.use('/', require('./web'));
router.use('/files', require('./files'));
router.use('/signals', require('./signals'));

router.use('/tradingview', require('./tradingview'));

router.use('/users', require('./users'));
router.use('/instruments', require('./instruments'));

router.use('/user-level-bounds', require('./user-level-bounds'));
router.use('/user-instrument-bounds', require('./user-instrument-bounds'));

module.exports = router;
