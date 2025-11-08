// src/controller/blog.controller.js
const BlogService = require('../services/blog.service');
const ApiResponse = require('../utils/response');
const blogReaders = require('../utils/blogReaders');
const BlogLikeService = require('../services/blogLike.service');
class BlogController {
//get blog by user 
static async getBlogsByUser(req, res, next) {
        try {
            const target_user_id = req.params.user_id;
            const { page = 1, limit = 10 } = req.query;

            const blogs = await BlogService.getBlogsByUser({
                target_user_id,
                page: Number(page),
                limit: Number(limit)
            });

            return res.json({
                success: true,
                page: Number(page),
                limit: Number(limit),
                count: blogs.length,
                blogs
            });
        } catch (err) {
            next(err);
        }
    }


    //get all blogs
  static async getBlogs(req, res, next) {
        try {
            const { page = 1, limit = 10, user_id } = req.query;
            const blogs = await BlogService.getBlogsPaginated({
                page: Number(page),
                limit: Number(limit),
                user_id,
            });

            return res.json({
                page: Number(page),
                limit: Number(limit),
                count: blogs.length,
                blogs,
            });
        } catch (err) {
            next(err);
        }
    }

    static async createAllBlog(req, res, next) {
        try {
            const blogsData = await blogReaders(); // load blogs từ file JSON
            await BlogService.createAllBlog(blogsData); // gọi method createAllBlog
            return ApiResponse.success(res, 'Blog created successfully', null, 201);
        } catch (err) {
            next(err);
        }
    }

        static async createBlogLike(req, res, next) {
        try {
            const { user_id, blog_id, isGoodRating, score } = req.body;
            const blogLike = await BlogLikeService.createBlogLike({
                user_id,
                blog_id,
                isGoodRating,
                score
            });

            return ApiResponse.success(res, 'Vote đã được thêm', blogLike, 201);
        } catch (err) {
            next(err);
        }
    }

    /**
     * DELETE /blogLikes
     * Body: { user_id, blog_id }
     */
    static async undoBlogLike(req, res, next) {
        try {
            const { user_id, blog_id } = req.body;
            const result = await BlogLikeService.undoBlogLike({ user_id, blog_id });

            return ApiResponse.success(res, result.message, result.blogLike);
        } catch (err) {
            next(err);
        }
    }

static async createBlog(req, res, next) {
    try {
        // req.file là ảnh
        const file = req.file || null;

        // req.body.data chứa JSON string
        const blogData = req.body.data ? JSON.parse(req.body.data) : {};

        const blog = await BlogService.createBlog(blogData, file);
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
