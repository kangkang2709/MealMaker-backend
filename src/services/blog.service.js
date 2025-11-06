// src/services/blog.service.js
const { db } = require('../config/firebase.config');
const Blog = require('../model/blog.model');
const { uploadImage } = require('../services/upload.service'); // ✅ đúng

const blogCollection = db.collection('blogs');

class BlogService {
    static async createAllBlog(data) {
        const batch = db.batch();
        const createdBlog = [];

        for (const blogData of data) {
            // Firestore tự sinh doc ID
            const docRef = blogCollection.doc();

            // Tạo Blog, dùng docRef.id làm _id
            const blog = new Blog({
                _id: docRef.id,
                user_id: blogData.user_id || 'unknown',
                title: blogData.title,
                recipe: blogData.recipe,
                created_at: blogData.created_at ? new Date(blogData.created_at) : new Date()
            });

            // Nếu có difficulty_score_distribution, khởi tạo và tính diff_score
            if (blogData.difficulty_score_distribution) {
                blog.difficulty_score_distribution = blogData.difficulty_score_distribution;

                // Tính rating = tổng votes positive
                blog.rating = Object.values(blog.difficulty_score_distribution).reduce((a, b) => a + b, 0);

                // Tính diff_score từ model
                blog.calculateDiffScore();
            }

            // Nếu có rating/bad_rating trực tiếp, gán luôn
            if (blogData.rating !== undefined) blog.rating = blogData.rating;
            if (blogData.bad_rating !== undefined) blog.bad_rating = blogData.bad_rating;

            // Đánh giá public status
            blog.evaluatePublicStatus();

            // Lưu vào batch
            batch.set(docRef, { ...blog });
            createdBlog.push({ docId: docRef.id, ...blog });
        }

        await batch.commit();
        return createdBlog;
    }




    static async createBlog(data, files = []) {
        // Upload images nếu có
        if (files.length > 0) {
            const uploadResults = await Promise.all(files.map(f => uploadImage(f.path)));
            data.images = uploadResults.map(r => r.url);
        } else {
            data.images = [];
        }

        const blog = new Blog(data);
        const docRef = blogCollection.doc(blog._id || undefined); // Nếu _id null, firestore auto tạo
        await docRef.set({ ...blog, created_at: new Date(), updated_at: new Date() });
        const doc = await docRef.get();
        return { id: doc.id, ...doc.data() };
    }

    // Get all blogs
    static async getAllBlogs() {
        const snapshot = await blogCollection.get();
        const blogs = [];
        snapshot.forEach(doc => blogs.push({ id: doc.id, ...doc.data() }));
        return blogs;
    }

    // Get blog by ID
    static async getBlogById(id) {
        const doc = await blogCollection.doc(id).get();
        if (!doc.exists) throw { code: 'BLOG_NOT_FOUND', message: 'Blog not found' };
        return { id: doc.id, ...doc.data() };
    }

    // Update blog
    static async updateBlog(id, data, files = []) {
        const docRef = blogCollection.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) throw { code: 'BLOG_NOT_FOUND', message: 'Blog not found' };

        // Upload ảnh mới nếu có
        if (files.length > 0) {
            const uploadResults = await Promise.all(files.map(f => uploadImage(f.path)));
            data.images = uploadResults.map(r => r.url);
        }

        data.updated_at = new Date();
        await docRef.update(data);
        const updatedDoc = await docRef.get();
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }

    // Delete blog
    static async deleteBlog(id) {
        const docRef = blogCollection.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) throw { code: 'BLOG_NOT_FOUND', message: 'Blog not found' };
        await docRef.delete();
        return { message: 'Blog deleted successfully' };
    }
}

module.exports = BlogService;
