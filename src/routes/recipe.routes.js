const express = require('express');
const router = express.Router();
const RecipeController = require('../controller/recipe.controller');
const upload = require('../middleware/upload');

// tạo recipe (nhiều ảnh)
router.post('/', upload.array('images', 5), RecipeController.createRecipe);

// cập nhật recipe
router.put('/:id', upload.array('images', 5), RecipeController.updateRecipe);

// lấy tất cả recipe
router.get('/', RecipeController.getAllRecipes);

// lấy recipe theo id
router.get('/:id', RecipeController.getRecipeById);

module.exports = router;
