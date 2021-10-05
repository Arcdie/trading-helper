const router = require('express').Router();

router.use('/', require('./web'));
router.use('/api', require('./api'));
router.use('/static', require('./static'));

module.exports = router;
