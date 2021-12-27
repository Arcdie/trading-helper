const router = require('express').Router();

const profitControllers = require('../controllers/web/profit');

router.get('/', profitControllers.getStrategyChoicePage);
router.get('/monitoring', profitControllers.getMonitoringPage);
router.get('/:strategy/:type', profitControllers.getTypeChoicePage);

module.exports = router;
