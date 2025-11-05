const express = require('express');
const router = express.Router();
const IngredientController = require('../controller/ingredient.controller');
const upload = require('../middleware/upload');

// tạo ingredient (tùy chọn ảnh)
router.post('/', upload.single('image'), IngredientController.createIngredient);

// cập nhật ingredient
router.put('/:id', upload.single('image'), IngredientController.updateIngredient);

// lấy tất cả ingredients
router.get('/', IngredientController.getAllIngredients);

// lấy ingredient theo id
router.get('/:id', IngredientController.getIngredientById);

module.exports = router;
