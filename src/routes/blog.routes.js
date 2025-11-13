// src/routes/blog.routes.js
const express = require('express');
const router = express.Router();
const BlogController = require('../controller/blog.controller');
const upload = require('../middleware/upload'); // multer

// Create blog với nhiều ảnh

router.put('/json', BlogController.createAllBlog);

router.post('/', upload.single('file'), BlogController.createBlog);

// Update blog

router.put('/like', BlogController.updateBlogLikeStatus);

router.put('/rating', BlogController.createBlogLike);
router.put('/unrating', BlogController.undoBlogLike);

// Get all blogs
router.get('/', BlogController.getBlogs);

router.get('/user/:user_id/liked', BlogController.getLikedBlogs);

router.get('/user/:user_id', BlogController.getBlogsByUser);

// Get blog by ID
router.get('/:id', BlogController.getBlogById);

// Delete blog
router.delete('/:id', BlogController.deleteBlog);

module.exports = router;
