const router = require('express').Router();

const tradingviewControllers = require('../controllers/tradingview');

router.get('/levels', tradingviewControllers.getLevels);
router.get('/token', tradingviewControllers.getJWTToken);

module.exports = router;
