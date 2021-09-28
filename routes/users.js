const router = require('express').Router();

const userControllers = require('../controllers/users');

router.get('/:userid', userControllers.getById);

router.post('/', userControllers.createUser);

module.exports = router;
