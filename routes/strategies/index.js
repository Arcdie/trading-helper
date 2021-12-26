const router = require('express').Router();

const strategyControllers = require('../../controllers/strategies');

router.get('/constants', strategyControllers.getConstants);

router.use('/priceJumps', require('./price-jumps'));
router.use('/priceRebounds', require('./price-rebounds'));

router.use('/spotVolumes', require('./spot-volumes'));

module.exports = router;
