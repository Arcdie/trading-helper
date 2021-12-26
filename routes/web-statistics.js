const router = require('express').Router();

const statisticsControllers = require('../controllers/web/statistics');

router.get('/', statisticsControllers.getStrategyChoicePage);
router.get('/:strategy', statisticsControllers.getStrategyPage);

module.exports = router;
