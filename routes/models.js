const router = require('express').Router();

const modelControllers = require('../controllers/models');

router.get('/', modelControllers.getAll);
router.get('/:modelName', modelControllers.getModelByName);

module.exports = router;
