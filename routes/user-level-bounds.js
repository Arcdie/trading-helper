const router = require('express').Router();

const userLevelBoundControllers = require('../controllers/user-level-bounds');

router.post('/', userLevelBoundControllers.createBound);

module.exports = router;
