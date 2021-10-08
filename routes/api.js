const router = require('express').Router();

// router.use('/files', require('./files'));
// router.use('/signals', require('./signals'));

router.use('/test', require('./test'));
router.use('/binance', require('./binance'));
router.use('/tradingview', require('./tradingview'));

router.use('/users', require('./users'));
router.use('/instruments', require('./instruments'));

router.use('/user-level-bounds', require('./user-level-bounds'));
router.use('/user-instrument-bounds', require('./user-instrument-bounds'));

module.exports = router;
