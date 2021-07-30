const router = require('express').Router();

const webControllers = require('../controllers/web');

router.get('/', webControllers.getMainPage);
router.get('/private', webControllers.getMainPage);

module.exports = router;
