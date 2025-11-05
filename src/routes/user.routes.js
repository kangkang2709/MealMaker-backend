const express = require('express');
const UserController = require('../controller/user.controller');

const router = express.Router();

router.get('/', UserController.getUsers);
router.post('/', UserController.createUser);

module.exports = router;
