// src/services/blog.service.js
const { db } = require('../config/firebase.config');
const Blog = require('../model/blog.model');
const { uploadImage } = require('../services/upload.service');
const EdamamIngredientService = require("../services/edamamIngredient.service");
const blogCollection = db.collection('blogs');
const blogLikeCollection = db.collection('blogLikes');
const RecipeService = require('../services/recipe.service');

const Filter = require('bad-words');
const spellchecker = require('simple-spellchecker');


const filter = new Filter();

class BlogService {

    static dictionary = null;

    static async loadDictionary() {
        if (!this.dictionary) {
            this.dictionary = await new Promise((res, rej) =>
                spellchecker.getDictionary("en-US", (err, dict) => err ? rej(err) : res(dict))
            );
        }
        return this.dictionary;
    }

    static sanitizeBlogInput(data) {
        data.title = data.title || "";
        data.description = data.description || "";
        data.recipe = data.recipe || {};
        data.recipe.description = data.recipe.description || "";
        data.recipe.ingredients_list = data.recipe.ingredients_list || [];
        return data;
    }

    static cleanAndMark(textOrArray, dictionary) {
        const process = (text) => {
            return text
                .split(/\s+/)
                .map(word => {
                    let w = dictionary.spellCheck(word) ? word : word + '*';
                    return filter.clean(w);
                })
                .join(' ');
        };

        if (Array.isArray(textOrArray)) return textOrArray.map(process);
        if (typeof textOrArray === 'string') return process(textOrArray);
        return textOrArray;
    }



    static async getBlogsPaginated({ page = 1, limit = 10, user_id }) {
        const offset = (page - 1) * limit;

        // 🔹 Lấy blog (theo created_at mới nhất)
        const snapshot = await blogCollection
            .orderBy('created_at', 'desc')
            .offset(offset)
            .limit(limit)
            .get();

        const blogs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Nếu có user_id thì lấy các vote của user đó
        let userVotesMap = {};
        if (user_id) {
            const likeSnapshot = await blogLikeCollection
                .where('user_id', '==', user_id)
                .get();

            likeSnapshot.forEach(doc => {
                const data = doc.data();
                userVotesMap[data.blog_id] = {
                    isGoodRating: data.isGoodRating,
                    score: data.score || null,
                };
            });
        }

        // Gắn trạng thái userVote vào từng blog
        const enrichedBlogs = blogs.map(blog => ({
            ...blog,
            user_vote: userVotesMap[blog._id] || null, // null nếu user chưa vote
        }));

        return enrichedBlogs;
    }

    //use json
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

    // Lấy danh sách blog có phân trang + trạng thái vote của user
    static async getBlogsPaginated({ page = 1, limit = 10, user_id }) {
        const offset = (page - 1) * limit;

        // 🔹 Lấy blog (theo created_at mới nhất)
        const snapshot = await blogCollection
            .orderBy('created_at', 'desc')
            .offset(offset)
            .limit(limit)
            .get();

        const blogs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Nếu có user_id thì lấy các vote của user đó
        let userVotesMap = {};
        if (user_id) {
            const likeSnapshot = await blogLikeCollection
                .where('user_id', '==', user_id)
                .get();

            likeSnapshot.forEach(doc => {
                const data = doc.data();
                userVotesMap[data.blog_id] = {
                    isGoodRating: data.isGoodRating,
                    score: data.score || null,
                };
            });
        }

        // Gắn trạng thái userVote vào từng blog
        const enrichedBlogs = blogs.map(blog => ({
            ...blog,
            user_vote: userVotesMap[blog._id] || null, // null nếu user chưa vote
        }));

        return enrichedBlogs;
    }

    static async getBlogsByUser({ target_user_id, page = 1, limit = 10 }) {
        if (!target_user_id) throw new Error('Missing target_user_id');

        // Lấy blog của user, sắp xếp theo created_at
        let query = blogCollection
            .where('user_id', '==', target_user_id)
            .orderBy('created_at', 'desc')
            .limit(limit * page);

        const snapshot = await query.get();
        const allBlogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Phân trang bằng slice (Firestore offset không tốt)
        const start = (page - 1) * limit;
        const blogsPage = allBlogs.slice(start, start + limit);

        // Lấy votes của chính chủ blog
        const likeSnapshot = await blogLikeCollection
            .where('user_id', '==', target_user_id)
            .get();

        const votesMap = {};
        likeSnapshot.forEach(doc => {
            const data = doc.data();
            votesMap[data.blog_id] = {
                isGoodRating: data.isGoodRating,
                score: data.score || null,
            };
        });

        // Gắn user_vote
        return blogsPage.map(blog => ({
            ...blog,
            user_vote: votesMap[blog.id] || null
        }));
    }




    static async createBlog(data, file = null) {
        const docRef = blogCollection.doc();

        // 🔹 Load dictionary 1 lần
        const dictionary = await this.loadDictionary();

        // 🔹 Sanitize input tránh undefined
        data = this.sanitizeBlogInput(data);

        const ingredients = data.recipe.ingredients_list;

        // 🔹 Upload image và tính nutrition song song
        const [nutritionResult, uploadResult] = await Promise.all([
            EdamamIngredientService.getNutritionForList(ingredients),
            file ? uploadImage(file.path) : Promise.resolve({ url: null })
        ]);
        data.image = uploadResult.url;

        // 🔹 Replace bad words + mark misspelled
        // data.title = this.cleanAndMark(data.title, dictionary);
        data.description = this.cleanAndMark(data.description, dictionary);
        data.recipe.description = this.cleanAndMark(data.recipe.description, dictionary);
        // data.recipe.ingredients_list = this.cleanAndMark(data.recipe.ingredients_list, dictionary);

        // 🔹 Tạo Blog object
        const blog = new Blog({
            _id: docRef.id,
            user_id: data.user_id || 'unknown',
            title: data.title,
            recipe: data.recipe,
            created_at: data.created_at ? new Date(data.created_at) : new Date(),
        });

        blog.difficulty_score = 0;
        blog.image_url = data.image;
        blog.recipe.image_url = data.image;
        blog.recipe.nutrition_facts = nutritionResult || "Cannot analyze nutrition";

        // 🔹 Lưu vào Firestore
        await docRef.set({ ...blog });

        return { id: docRef.id, ...blog };
    }




    static async getUserVote(req, res, next) {
        try {
            const { user_id, blog_id } = req.query;

            const snapshot = await blogLikeCollection
                .where('user_id', '==', user_id)
                .where('blog_id', '==', blog_id)
                .get();

            if (snapshot.empty) {
                return res.json({ user_vote: null });
            }

            const vote = snapshot.docs[0].data();
            return res.json({ user_vote: vote });
        } catch (err) {
            next(err);
        }
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
