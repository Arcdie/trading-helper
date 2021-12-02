const router = require('express').Router();

const statisticsControllers = require('../controllers/web/statistics');

router.get('/volume-spot', statisticsControllers.getVolumeSpotStatistics);
router.get('/volume-futures', statisticsControllers.getVolumeFuturesStatistics);

router.get('/price-jump', statisticsControllers.getPriceJumpStatistics);

module.exports = router;
