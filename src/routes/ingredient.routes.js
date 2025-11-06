const express = require("express");
const router = express.Router();
const IngredientController = require("../controller/ingredient.controller");

// 🔹 Edamam Food Database (Step 1 - Parser)
// 🔹 New endpoint: multiple ingredient nutrition
router.post("/nutrition-list", IngredientController.getNutritionForList);
// ✅ USDA
router.get("/data/:id", IngredientController.searchExternalIngredient);

router.get("/", IngredientController.getAllIngredients);
router.post("/", IngredientController.createIngredient);

router.get("/raw", IngredientController.getIngredientRaw);



module.exports = router;
