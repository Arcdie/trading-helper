const router = require('express').Router();

router.use('/price-jumps', require('./price-jumps'));
router.use('/spot-volumes', require('./spot-volumes'));

module.exports = router;
