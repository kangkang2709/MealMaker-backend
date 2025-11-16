/**
 * @swagger
 * tags:
 *   name: Blogs
 *   description: API quản lý Blog
 */

const express = require('express');
const router = express.Router();
const BlogController = require('../controller/blog.controller');
const upload = require('../middleware/upload'); // multer


// =============================
// CREATE BLOG (Nhiều blog qua JSON)
// =============================
/**
 * @swagger
 * /api/blogs/json:
 *   put:
 *     summary: Tạo nhiều blog từ JSON
 *     tags: [Blogs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 content:
 *                   type: string
 *     responses:
 *       200:
 *         description: Tạo nhiều blog thành công
 */
router.put('/json', BlogController.createAllBlog);


// =============================
// CREATE BLOG (Có upload ảnh)
// =============================
/**
 * @swagger
 * /api/blogs:
 *   post:
 *     summary: Tạo blog mới với 1 file ảnh
 *     tags: [Blogs]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               user_id:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Blog được tạo thành công
 */
router.post('/', upload.single('file'), BlogController.createBlog);


// =============================
// LIKE BLOG
// =============================
/**
 * @swagger
 * /api/blogs/like:
 *   put:
 *     summary: Like một blog
 *     tags: [Blogs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               blog_id:
 *                 type: string
 *               user_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Like thành công
 */
router.put('/like', BlogController.updateBlogLikeStatus);


// =============================
// RATING BLOG
// =============================
/**
 * @swagger
 * /api/blogs/rating:
 *   put:
 *     summary: Rating blog
 *     tags: [Blogs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               blog_id:
 *                 type: string
 *               user_id:
 *                 type: string
 *               rating:
 *                 type: number
 *     responses:
 *       200:
 *         description: Rating thành công
 */
router.put('/rating', BlogController.createBlogLike);


// =============================
// UNRATING BLOG
// =============================
/**
 * @swagger
 * /api/blogs/unrating:
 *   put:
 *     summary: Hủy rating blog
 *     tags: [Blogs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               blog_id:
 *                 type: string
 *               user_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Unrating thành công
 */
router.put('/unrating', BlogController.undoBlogLike);


// =============================
// GET ALL BLOGS
// =============================
/**
 * @swagger
 * /api/blogs:
 *   get:
 *     summary: Lấy danh sách blog
 *     tags: [Blogs]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', BlogController.getBlogs);


// =============================
// GET BLOG USER LIKED
// =============================
/**
 * @swagger
 * /api/blogs/user/{user_id}/liked:
 *   get:
 *     summary: Lấy danh sách blog user đã like
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/user/:user_id/liked', BlogController.getLikedBlogs);


// =============================
// GET BLOG BY USER
// =============================
/**
 * @swagger
 * /api/blogs/user/{user_id}:
 *   get:
 *     summary: Lấy blog theo user
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/user/:user_id', BlogController.getBlogsByUser);


// =============================
// GET BLOG BY ID
// =============================
/**
 * @swagger
 * /api/blogs/{id}:
 *   get:
 *     summary: Lấy blog theo ID
 *     tags: [Blogs]
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
router.get('/:id', BlogController.getBlogById);


// =============================
// DELETE BLOG
// =============================
/**
 * @swagger
 * /api/blogs/{id}:
 *   delete:
 *     summary: Xóa blog theo ID
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/:id', BlogController.deleteBlog);


module.exports = router;
