const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); // dùng single
const UserController = require('../controller/user.controller');

router.put('/all', UserController.createAllUser);

router.get('/', UserController.getAllUsers);
router.get('/:id', UserController.getUserById);
// user.routes.js
router.post('/', upload.single('avatar'), UserController.createUser);

router.put('/:id', upload.single('avatar'), UserController.updateUser);
router.delete('/:id', UserController.deleteUser);

module.exports = router;
