const router = require('express').Router();

router.use('/binance', require('./binance'));

router.use('/users', require('./users'));
router.use('/files', require('./files'));
router.use('/trades', require('./trades'));
router.use('/candles', require('./candles'));
router.use('/strategies', require('./strategies'));
router.use('/instruments', require('./instruments'));

router.use('/user-level-bounds', require('./user-level-bounds'));
router.use('/user-trade-bounds', require('./user-trade-bounds'));
router.use('/user-binance-bounds', require('./user-binance-bounds'));
router.use('/instrument-robot-bounds', require('./instrument-robot-bounds'));
router.use('/instrument-volume-bounds', require('./instrument-volume-bounds'));

router.use('/logs', require('./logs'));
router.use('/models', require('./models'));
router.use('/telegram', require('./telegram'));

module.exports = router;
