const RecipeService = require('../services/recipe.service');
const ApiResponse = require('../utils/response');
const recipesReader = require('../utils/receiptReader');

class RecipeController {

    static async createAllRecipe(req, res, next) {
        try {
            const rawRecipes = await recipesReader();  // rawRecipes: [{ title, description, images }, ...]
            await RecipeService.createAllRecipes(rawRecipes); // lưu vào Firestore
            return ApiResponse.success(res, 'All recipes created successfully', null, 201);
        } catch (err) {
            next(err);
        }
    }



    static async createRecipe(req, res, next) {
        try {
            const file = req.file || null;
            const recipeData = req.body.data ? JSON.parse(req.body.data) : {};
            const recipe = await RecipeService.createRecipe(recipeData,file);
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
