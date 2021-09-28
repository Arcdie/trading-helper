const router = require('express').Router();

const instrumentControllers = require('../controllers/instruments');

router.post('/', instrumentControllers.createInstrument);
router.post('/do-exist', instrumentControllers.doExistInstruments);

module.exports = router;
