// src/routes/blog.routes.js
const express = require('express');
const router = express.Router();
const BlogController = require('../controller/blog.controller');
const upload = require('../middleware/upload'); // multer

// Create blog với nhiều ảnh

router.put('/json', BlogController.createAllBlog);

router.post('/', upload.array('images', 5), BlogController.createBlog);

// Get all blogs
router.get('/', BlogController.getAllBlogs);

// Get blog by ID
router.get('/:id', BlogController.getBlogById);

// Update blog (có thể upload thêm nhiều ảnh mới)
router.put('/:id', upload.array('images', 5), BlogController.updateBlog);

// Delete blog
router.delete('/:id', BlogController.deleteBlog);

module.exports = router;
