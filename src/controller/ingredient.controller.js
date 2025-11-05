const IngredientService = require('../services/ingredient.service');
const ApiResponse = require('../utils/response');

class IngredientController {
    static async createIngredient(req, res, next) {
        try {
            const ingredient = await IngredientService.createIngredient(req.body, req.file);
            return ApiResponse.success(res, 'Ingredient created successfully', ingredient, 201);
        } catch (err) {
            next(err);
        }
    }

    static async updateIngredient(req, res, next) {
        try {
            const ingredient = await IngredientService.updateIngredient(req.params.id, req.body, req.file);
            return ApiResponse.success(res, 'Ingredient updated successfully', ingredient, 200);
        } catch (err) {
            next(err);
        }
    }

    static async getAllIngredients(req, res, next) {
        try {
            const ingredients = await IngredientService.getAllIngredients();
            return ApiResponse.success(res, 'Ingredients fetched successfully', ingredients);
        } catch (err) {
            next(err);
        }
    }

    static async getIngredientById(req, res, next) {
        try {
            const ingredient = await IngredientService.getIngredientById(req.params.id);
            return ApiResponse.success(res, 'Ingredient fetched successfully', ingredient);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = IngredientController;
