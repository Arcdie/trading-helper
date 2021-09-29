const router = require('express').Router();

const userLevelBoundControllers = require('../controllers/user-level-bounds');

router.get('/', userLevelBoundControllers.getUserLevelBounds);

router.post('/', userLevelBoundControllers.createBound);

module.exports = router;
