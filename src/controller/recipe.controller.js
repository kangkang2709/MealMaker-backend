const RecipeService = require('../services/recipe.service');
const ApiResponse = require('../utils/response');
const recipesReader = require('../utils/receiptReader');

class RecipeController {

    // ==============================
    // CREATE ALL RECIPES (FROM FILE)
    // ==============================
    static async createAllRecipe(req, res, next) {
        try {
            const rawRecipes = await recipesReader();
            await RecipeService.createAllRecipes(rawRecipes);
            return ApiResponse.success(res, 'All recipes created successfully', rawRecipes, 201);
        } catch (err) {
            next(err);
        }
    }

    // ==============================
    // CREATE SINGLE RECIPE
    // ==============================
    static async createRecipe(req, res, next) {
        try {
            const file = req.file || null;
            const recipeData = req.body.data ? JSON.parse(req.body.data) : {};
            const recipe = await RecipeService.createRecipe(recipeData, file);
            return ApiResponse.success(res, 'Recipe created successfully', recipe, 201);
        } catch (err) {
            next(err);
        }
    }

    // ==============================
    // UPDATE RECIPE
    // ==============================
    static async updateRecipe(req, res, next) {
        try {
            const recipe = await RecipeService.updateRecipe(req.params.id, req.body, req.files);
            return ApiResponse.success(res, 'Recipe updated successfully', recipe, 200);
        } catch (err) {
            next(err);
        }
    }

    // ==============================
    // GET ALL RECIPES
    // ==============================
    static async getAllRecipes(req, res, next) {
        try {
            const recipes = await RecipeService.getAllRecipes();
            return ApiResponse.success(res, 'Recipes fetched successfully', recipes);
        } catch (err) {
            next(err);
        }
    }

    // ==============================
    // GET RECIPE BY ID
    // ==============================
    static async getRecipeById(req, res, next) {
        try {
            const recipe = await RecipeService.getRecipeById(req.params.id);
            return ApiResponse.success(res, 'Recipe fetched successfully', recipe);
        } catch (err) {
            next(err);
        }
    }

    // ==============================
    // LIKE RECIPE
    // ==============================
    static async likeRecipe(req, res, next) {
        try {
            const { user_id, recipe_id } = req.body;
            const result = await RecipeService.likeRecipe(user_id, recipe_id);
            return ApiResponse.success(res, result.message, result, result.success ? 200 : 400);
        } catch (err) {
            next(err);
        }
    }

    // ==============================
    // UNLIKE RECIPE
    // ==============================
    static async unlikeRecipe(req, res, next) {
        try {
            const { user_id, recipe_id } = req.body;
            const result = await RecipeService.unlikeRecipe(user_id, recipe_id);
            return ApiResponse.success(res, result.message, result, result.success ? 200 : 400);
        } catch (err) {
            next(err);
        }
    }

    // ==============================
    // GET USER LIKED RECIPES (FULL DATA)
    // ==============================
    static async getUserLikedRecipes(req, res, next) {
        try {
            const { userId } = req.params;
            const recipes = await RecipeService.getUserLikedRecipes(userId);
            return ApiResponse.success(res, 'Liked recipes fetched successfully', recipes);
        } catch (err) {
            next(err);
        }
    }

    // ==============================
    // GET ALL RECIPES WITH LIKE STATUS
    // ==============================
    static async getAllRecipesWithLikeStatus(req, res, next) {
        try {
            const { userId } = req.params;
            const recipes = await RecipeService.getAllRecipesWithLikeStatus(userId);
            return ApiResponse.success(res, 'Recipes with like status fetched successfully', recipes);
        } catch (err) {
            next(err);
        }
    }

    // ==============================
    // SEARCH RECIPES BY INGREDIENTS (NEW)
    // ==============================

    static async searchRecipesByIngredients(req, res, next) {
        try {
            const { user_id, ingredients } = req.body;
            const page = parseInt(req.query.page) || 1;
            const size = parseInt(req.query.size) || 10;

            if (!user_id || !Array.isArray(ingredients) || ingredients.length === 0) {
                return ApiResponse.error(res, 'Invalid input', 400);
            }

            const recipes = await RecipeService.findRecipesByIngredients(user_id, ingredients, page, size);

            return ApiResponse.success(res, 'Recipes found successfully', {
                page,
                size,
                total: recipes.length,
                data: recipes
            });
        } catch (err) {
            next(err);
        }
    }


}

module.exports = RecipeController;
