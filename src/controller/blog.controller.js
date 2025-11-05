// src/controller/blog.controller.js
const BlogService = require('../services/blog.service');
const ApiResponse = require('../utils/response');

class BlogController {
    static async createBlog(req, res, next) {
        try {
            const files = req.files || [];
            const blog = await BlogService.createBlog(req.body, files);
            return ApiResponse.success(res, 'Blog created successfully', blog, 201);
        } catch (err) {
            next(err);
        }
    }

    static async getAllBlogs(req, res, next) {
        try {
            const blogs = await BlogService.getAllBlogs();
            return ApiResponse.success(res, 'Blogs fetched successfully', blogs);
        } catch (err) {
            next(err);
        }
    }

    static async getBlogById(req, res, next) {
        try {
            const blog = await BlogService.getBlogById(req.params.id);
            return ApiResponse.success(res, 'Blog fetched successfully', blog);
        } catch (err) {
            next(err);
        }
    }

    static async updateBlog(req, res, next) {
        try {
            const files = req.files || [];
            const blog = await BlogService.updateBlog(req.params.id, req.body, files);
            return ApiResponse.success(res, 'Blog updated successfully', blog);
        } catch (err) {
            next(err);
        }
    }

    static async deleteBlog(req, res, next) {
        try {
            const result = await BlogService.deleteBlog(req.params.id);
            return ApiResponse.success(res, result.message);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = BlogController;
