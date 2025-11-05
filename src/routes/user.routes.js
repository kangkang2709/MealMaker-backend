const express = require('express');
const router = express.Router();
const UserController = require('../controller/user.controller');
const asyncWrapper = require('../utils/asyncWrapper');

router.get('/', asyncWrapper(UserController.getUsers));
router.post('/', asyncWrapper(UserController.createUser));

module.exports = router;
