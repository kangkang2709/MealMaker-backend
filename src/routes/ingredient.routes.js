const express = require("express");
const router = express.Router();
const IngredientController = require("../controller/ingredient.controller");



// ✅ USDA
router.get("/data/:id", IngredientController.searchExternalIngredient);

router.get("/", IngredientController.getAllIngredients);
router.post("/", IngredientController.createIngredient);

router.get("/raw", IngredientController.getIngredientRaw);



module.exports = router;
