const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const UserController = require('../controller/user.controller');

// Auth
router.post('/login', UserController.login);

// Bulk operations
router.post('/json', UserController.createAllUser);
router.get('/ids', UserController.getAllUserIds);

// User CRUD
router.get('/', UserController.getAllUsers);
router.post('/', upload.single('file'), UserController.createUser);
router.get('/:id', UserController.getUserById);

// User profile updates
router.patch('/:id/ai_profile', UserController.updateAIProfile);
router.patch('/:id/ai_profile/tags', UserController.addTagsList);
router.patch('/:id/ai_profile/cooking-skill/increase', UserController.increaseCookingSkill);
router.patch('/:id/ai_profile/cooking-skill/decrease', UserController.decreaseCookingSkill);
// Fridge operations
router.patch('/:id/fridge', UserController.updateFridge);
router.patch('/:id/fridge/:day', UserController.subtractFridge);

// Weekly menu & shopping
router.patch('/:id/weekly_menu', UserController.updateWeeklyMenu);
router.patch('/:id/weekly_shopping_list', UserController.updateWeeklyShoppingList);

module.exports = router;
