const router = require('express').Router();

const logControllers = require('../controllers/logs');
const logCronControllers = require('../controllers/logs/cron');

// cron
router.get('/cron/clear-pm2-logs', logCronControllers.clearPm2Logs);

router.get('/clear', logControllers.clearLogs);

router.get('/:typeLogs', logControllers.getLogsFile);

module.exports = router;
