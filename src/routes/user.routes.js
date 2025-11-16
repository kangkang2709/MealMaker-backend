const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const UserController = require('../controller/user.controller');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API quản lý người dùng
 */

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Đăng nhập người dùng
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post('/login', UserController.login);

/**
 * @swagger
 * /api/users/json:
 *   post:
 *     summary: Tạo nhiều user từ JSON
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post('/json', UserController.createAllUser);

/**
 * @swagger
 * /api/users/ids:
 *   get:
 *     summary: Lấy danh sách ID tất cả user
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/ids', UserController.getAllUserIds);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lấy tất cả người dùng
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', UserController.getAllUsers);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Tạo user mới (có upload file)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post('/', upload.single('file'), UserController.createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Lấy thông tin user theo ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/:id', UserController.getUserById);

/**
 * @swagger
 * /api/users/{id}/ai_profile:
 *   patch:
 *     summary: Cập nhật AI profile cho user
 *     tags: [Users]
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
router.patch('/:id/ai_profile', UserController.updateAIProfile);

/**
 * @swagger
 * /api/users/{id}/ai_profile/tags:
 *   patch:
 *     summary: Thêm danh sách tags cho AI profile
 *     tags: [Users]
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
router.patch('/:id/ai_profile/tags', UserController.addTagsList);

/**
 * @swagger
 * /api/users/{id}/ai_profile/cooking-skill/increase:
 *   patch:
 *     summary: Tăng skill nấu ăn
 *     tags: [Users]
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
router.patch('/:id/ai_profile/cooking-skill/increase', UserController.increaseCookingSkill);

/**
 * @swagger
 * /api/users/{id}/ai_profile/cooking-skill/decrease:
 *   patch:
 *     summary: Giảm skill nấu ăn
 *     tags: [Users]
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
router.patch('/:id/ai_profile/cooking-skill/decrease', UserController.decreaseCookingSkill);

/**
 * @swagger
 * /api/users/{id}/fridge:
 *   patch:
 *     summary: Cập nhật nguyên liệu trong tủ lạnh
 *     tags: [Users]
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
router.patch('/:id/fridge', UserController.updateFridge);

/**
 * @swagger
 * /api/users/{id}/fridge/{day}:
 *   patch:
 *     summary: Trừ nguyên liệu theo số ngày bảo quản
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: day
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Thành công
 */
router.patch('/:id/fridge/:day', UserController.subtractFridge);

/**
 * @swagger
 * /api/users/{id}/weekly_menu:
 *   patch:
 *     summary: Cập nhật thực đơn hàng tuần
 *     tags: [Users]
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
router.patch('/:id/weekly_menu', UserController.updateWeeklyMenu);

/**
 * @swagger
 * /api/users/{id}/weekly_shopping_list:
 *   patch:
 *     summary: Cập nhật danh sách mua sắm hàng tuần
 *     tags: [Users]
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
router.patch('/:id/weekly_shopping_list', UserController.updateWeeklyShoppingList);

module.exports = router;
