const router = require('express').Router();

const userInstrumentBoundControllers = require('../controllers/user-instrument-bounds');

// router.post('/', userInstrumentBoundControllers.createBound);

router.get('/', userInstrumentBoundControllers.getUserInstrumentBounds);

router.post('/do-exist', userInstrumentBoundControllers.doExistBounds);

module.exports = router;
