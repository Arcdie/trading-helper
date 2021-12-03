const router = require('express').Router();

const profitControllers = require('../controllers/web/profit');

router.get('/volume-spot', profitControllers.getVolumeSpotProfit);

module.exports = router;
