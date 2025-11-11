const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); // dùng single
const UserController = require('../controller/user.controller');

router.post('/login', UserController.login);

router.put('/all', UserController.createAllUser);

router.get('/', UserController.getAllUsers);
// user.routes.js
router.post('/', upload.single('file'), UserController.createUser);

router.get('/:id', UserController.getUserById);

router.patch('/:id/ai_profile', UserController.updateAIProfile);
router.patch('/:id/fridge', UserController.updateFridge);
router.patch('/:id/weekly_menu', UserController.updateWeeklyMenu);
router.patch('/:id/weekly_shopping_list', UserController.updateWeeklyShoppingList);

module.exports = router;
