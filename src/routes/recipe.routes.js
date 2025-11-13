const express = require('express');
const router = express.Router();
const RecipeController = require('../controller/recipe.controller');

router.post('/json', RecipeController.createAllRecipe);
router.get('/ids', RecipeController.getAllRecipeIds);
router.post('/like/json', RecipeController.createAllRecipeLike);

//find recipes by 3 ingredients
router.get('/ingredients', RecipeController.searchRecipesByIngredients);
router.post('/', RecipeController.createRecipe);
router.get('/', RecipeController.getAllRecipes);


// Like / Unlike
router.put('/like', RecipeController.likeRecipe);
router.put('/unlike', RecipeController.unlikeRecipe);
router.get('/liked/:userId', RecipeController.getUserLikedRecipes);
router.get('/with-like-status/:userId', RecipeController.getAllRecipesWithLikeStatus);
router.get('/tags/:userId', RecipeController.get10RecipesWithTagList);


router.put('/:id', RecipeController.updateRecipe);
router.get('/:id', RecipeController.getRecipeById);

// Get user's liked recipes

// Get all recipes with like status

module.exports = router;
