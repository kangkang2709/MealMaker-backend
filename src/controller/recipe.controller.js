const RecipeService = require('../services/recipe.service');
const ApiResponse = require('../utils/response');

class RecipeController {
    static async createRecipe(req, res, next) {
        try {
            const recipe = await RecipeService.createRecipe(req.body, req.files);
            return ApiResponse.success(res, 'Recipe created successfully', recipe, 201);
        } catch (err) {
            next(err);
        }
    }

    static async updateRecipe(req, res, next) {
        try {
            const recipe = await RecipeService.updateRecipe(req.params.id, req.body, req.files);
            return ApiResponse.success(res, 'Recipe updated successfully', recipe, 200);
        } catch (err) {
            next(err);
        }
    }

    static async getAllRecipes(req, res, next) {
        try {
            const recipes = await RecipeService.getAllRecipes();
            return ApiResponse.success(res, 'Recipes fetched successfully', recipes);
        } catch (err) {
            next(err);
        }
    }

    static async getRecipeById(req, res, next) {
        try {
            const recipe = await RecipeService.getRecipeById(req.params.id);
            return ApiResponse.success(res, 'Recipe fetched successfully', recipe);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = RecipeController;
