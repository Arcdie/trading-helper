const router = require('express').Router();

const statisticsControllers = require('../controllers/web/statistics');

router.get('/', statisticsControllers.getStrategyChoicePage);
router.get('/:strategy/:type', statisticsControllers.getTypeChoicePage);

module.exports = router;
