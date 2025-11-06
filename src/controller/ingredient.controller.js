const IngredientService = require("../services/ingredient.service");
const IngredientApiService = require("../services/ingredientapi.services");
const EdamamIngredientService = require("../services/edamamIngredient.service");
const EdamamFoodService = require("../services/edamamFood.service");
const ApiResponse = require("../utils/response");

class IngredientController {


    static async getNutritionForList(req, res, next) {
        try {
            const { ingredients } = req.body;

            if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
                return ApiResponse.error(res, "Ingredients list is required and must be an array", 400);
            }

            const data = await EdamamIngredientService.getNutritionForList(ingredients);

            return ApiResponse.success(
                res,
                "Nutrition data for ingredient list fetched successfully",
                data
            );
        } catch (err) {
            next(err);
        }
    }

    static async getIngredientRaw(req, res, next) {

        const { name, quantity } = req.query;
        try {
            if (!name) {
                return ApiResponse.error(res, "Missing ingredient name", 400);
            }

            const qty = quantity ? Number(quantity) : 100;
            const data = await EdamamIngredientService.getRawNutrition(name, qty);

            return ApiResponse.success(
                res,
                "Raw Edamam data fetched successfully",
                data
            );
        } catch (err) {
            next(err);
        }
    }
    static async searchExternalIngredient(req, res, next) {
        try {
            const name = req.params.id || req.query.name;
            if (!name) return ApiResponse.error(res, "Missing ingredient name", 400);

            const result = await IngredientApiService.getIngredient(name);
            if (!result) return ApiResponse.error(res, "Ingredient not found in USDA", 404);

            return ApiResponse.success(res, "Ingredient fetched from USDA successfully", result);
        } catch (err) {
            next(err);
        }
    }



    // ✅ Các hàm DB local
    static async createIngredient(req, res, next) {
        try {
            const ingredient = await IngredientService.createIngredient(req.body, req.file);
            return ApiResponse.success(res, "Ingredient created successfully", ingredient, 201);
        } catch (err) {
            next(err);
        }
    }

    static async updateIngredient(req, res, next) {
        try {
            const ingredient = await IngredientService.updateIngredient(req.params.id, req.body, req.file);
            return ApiResponse.success(res, "Ingredient updated successfully", ingredient);
        } catch (err) {
            next(err);
        }
    }

    static async getAllIngredients(req, res, next) {
        try {
            const ingredients = await IngredientService.getAllIngredients();
            return ApiResponse.success(res, "Ingredients fetched successfully", ingredients);
        } catch (err) {
            next(err);
        }
    }

    static async getIngredientById(req, res, next) {
        try {
            const ingredient = await IngredientService.getIngredientById(req.params.id);
            return ApiResponse.success(res, "Ingredient fetched successfully", ingredient);
        } catch (err) {
            next(err);
        }
    }


}

module.exports = IngredientController;
