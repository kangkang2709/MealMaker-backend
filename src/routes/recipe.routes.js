const express = require('express');
const router = express.Router();
const RecipeController = require('../controller/recipe.controller');
const upload = require('../middleware/upload');


// tạo recipe 
router.post('/', upload.single('file'), RecipeController.createRecipe);


router.post('/json', RecipeController.createAllRecipe);

// lấy tất cả recipe
router.get('/', RecipeController.getAllRecipes);

// lấy recipe theo id
router.get('/:id', RecipeController.getRecipeById);

module.exports = router;
