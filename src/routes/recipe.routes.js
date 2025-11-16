const express = require('express');
const router = express.Router();
const RecipeController = require('../controller/recipe.controller');

/**
 * @swagger
 * tags:
 *   name: Recipes
 *   description: API quản lý công thức nấu ăn
 */

/**
 * @swagger
 * /api/recipes/json:
 *   post:
 *     summary: Tạo nhiều recipe từ JSON
 *     tags: [Recipes]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post('/json', RecipeController.createAllRecipe);

/**
 * @swagger
 * /api/recipes/ids:
 *   get:
 *     summary: Lấy danh sách ID tất cả recipe
 *     tags: [Recipes]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/ids', RecipeController.getAllRecipeIds);

/**
 * @swagger
 * /api/recipes/like/json:
 *   post:
 *     summary: Tạo danh sách like recipe từ JSON
 *     tags: [Recipes]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post('/like/json', RecipeController.createAllRecipeLike);

/**
 * @swagger
 * /api/recipes/ingredients:
 *   post:
 *     summary: Tìm recipe theo 3 nguyên liệu
 *     tags: [Recipes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post('/ingredients', RecipeController.searchRecipesByIngredients);

/**
 * @swagger
 * /api/recipes:
 *   post:
 *     summary: Tạo một recipe mới
 *     tags: [Recipes]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post('/', RecipeController.createRecipe);

/**
 * @swagger
 * /api/recipes:
 *   get:
 *     summary: Lấy tất cả recipe
 *     tags: [Recipes]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', RecipeController.getAllRecipes);

/**
 * @swagger
 * /api/recipes/like:
 *   put:
 *     summary: Like một recipe
 *     tags: [Recipes]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.put('/like', RecipeController.likeRecipe);

/**
 * @swagger
 * /api/recipes/unlike:
 *   put:
 *     summary: Bỏ like recipe
 *     tags: [Recipes]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.put('/unlike', RecipeController.unlikeRecipe);

/**
 * @swagger
 * /api/recipes/liked/{userId}:
 *   get:
 *     summary: Lấy danh sách recipe mà user đã like
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/liked/:userId', RecipeController.getUserLikedRecipes);

/**
 * @swagger
 * /api/recipes/with-like-status/{userId}:
 *   get:
 *     summary: Lấy tất cả recipe + trạng thái like theo user
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/with-like-status/:userId', RecipeController.getAllRecipesWithLikeStatus);

/**
 * @swagger
 * /api/recipes/tags/{userId}:
 *   get:
 *     summary: Lấy 10 recipe + danh sách tag theo user
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/tags/:userId', RecipeController.get10RecipesWithTagList);

/**
 * @swagger
 * /api/recipes/{id}:
 *   put:
 *     summary: Cập nhật recipe theo ID
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.put('/:id', RecipeController.updateRecipe);

/**
 * @swagger
 * /api/recipes/{id}:
 *   get:
 *     summary: Lấy recipe theo ID
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/:id', RecipeController.getRecipeById);

module.exports = router;
