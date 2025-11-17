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
const SpellCorrector = require('spelling-corrector');
const spell = new SpellCorrector();

spell.loadDictionary();
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

    static cleanAndMark(text) {
        if (!text || typeof text !== "string") return "";

        return text
            .split(/\s+/)
            .map(word => {

                // Bỏ qua số nguyên/thập phân
                if (/^\d+(\.\d+)?$/.test(word)) return word;

                // Bỏ qua số + đơn vị (300g, 1tbsp)
                if (/^\d+(\.\d+)?[a-zA-Z]+$/.test(word)) return word;

                // Bỏ qua dấu câu hoặc ký tự đặc biệt đơn lẻ
                if (/^[.,!?;:()\[\]{}_\-]+$/.test(word)) return word;

                // Nếu từ bị filter.clean() thay đổi → là từ nhạy cảm
                let cleaned = "";
                try {
                    cleaned = filter.clean(word);
                } catch {
                    return word; // fallback
                }

                if (cleaned !== word) {
                    return word + "*"; // đánh dấu từ nhạy cảm
                }

                return word;
            })
            .join(" ");
    }



    static cleanAndCorrect(text) {
        if (!text || typeof text !== "string") return "";

        // Escape xuống dòng để không phá JSON
        text = text.replace(/\r\n|\r|\n/g, "\\n");

        return text
            .split(/\s+/)
            .map(token => {
                if (!token) return "";

                // Tách leading và trailing punctuation (giữ lại hyphen '-' trong core)
                const leadingMatch = token.match(/^[^A-Za-z0-9-]+/);
                const trailingMatch = token.match(/[^A-Za-z0-9-]+$/);

                const leading = leadingMatch ? leadingMatch[0] : "";
                const trailing = trailingMatch ? trailingMatch[0] : "";

                // core: phần giữa (có thể chứa letters, numbers, hyphen)
                const core = token.substring(leading.length, token.length - trailing.length);

                if (!core) {
                    // token chỉ là punctuation
                    return token;
                }

                // Bỏ qua số nguyên / thập phân
                if (/^\d+(\.\d+)?$/.test(core)) return leading + core + trailing;

                // Bỏ qua số + đơn vị (300g, 1tbsp)
                if (/^\d+(\.\d+)?[a-zA-Z]+$/.test(core)) return leading + core + trailing;

                // Nếu core chứa underscores (_) coi là ký tự đặc biệt -> không sửa (giữ nguyên)
                if (/[_]/.test(core)) return leading + core + trailing;

                // Kiểm tra từ nhạy cảm (chỉ trên core)
                let cleaned = core;
                try {
                    // filter.clean có thể thay đổi từ thành '***' hoặc trả null (bắt try)
                    cleaned = filter.clean(core);
                } catch (e) {
                    cleaned = core;
                }

                // Nếu bad-words thay đổi core => coi là nhạy cảm
                if (cleaned !== core) {
                    return leading + "****" + trailing;
                }

                // Sửa chính tả:
                // Nếu có hyphen, sửa từng phần riêng (ví dụ: str-fry -> stir-fry)
                if (core.includes('-')) {
                    const parts = core.split('-');
                    const correctedParts = parts.map(p => {
                        // nếu p là số/đơn vị giữ nguyên
                        if (/^\d+(\.\d+)?$/.test(p) || /^\d+(\.\d+)?[a-zA-Z]+$/.test(p)) return p;
                        // nếu empty keep
                        if (!p) return p;
                        // Sửa chính tả bằng spell.correct (giữ nguyên case ban đầu)
                        const corrected = spell.correct(p);
                        return corrected || p;
                    });
                    return leading + correctedParts.join('-') + trailing;
                }

                // Bình thường: sửa core bằng spell.correct
                const corrected = spell.correct(core) || core;
                return leading + corrected + trailing;
            })
            .join(" ");
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
                    is_liked: data.is_liked || false
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

    static async getLikedBlogsByUser({ user_id, page = 1, limit = 10, lastDocId = null }) {
        if (!user_id) throw new Error('user_id là bắt buộc');

        let query = blogLikeCollection
            .where('user_id', '==', user_id)
            .where('is_liked', '==', true)
            .limit(limit);

        if (lastDocId) {
            const lastDoc = await blogLikeCollection.doc(lastDocId).get();
            if (lastDoc.exists) query = query.startAfter(lastDoc);
        }

        const likeSnapshot = await query.get();
        if (likeSnapshot.empty) return { blogs: [], lastDocId: null };

        const likedBlogIds = likeSnapshot.docs.map(doc => doc.data().blog_id);

        // Batch fetch song song để tối ưu
        const blogBatchesPromises = [];
        for (let i = 0; i < likedBlogIds.length; i += 10) {
            const batchIds = likedBlogIds.slice(i, i + 10);
            blogBatchesPromises.push(
                blogCollection.where('__name__', 'in', batchIds).get()
            );
        }

        const blogDocsArray = await Promise.all(blogBatchesPromises);
        const blogs = blogDocsArray.flatMap(snapshot =>
            snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        );

        const userVotesMap = {};
        likeSnapshot.forEach(doc => {
            const data = doc.data();
            userVotesMap[data.blog_id] = {
                isGoodRating: data.isGoodRating,
                score: data.score || null,
                is_liked: data.is_liked,
            };
        });

        const enrichedBlogs = blogs.map(blog => ({
            ...blog,
            user_vote: userVotesMap[blog.id] || null,
        }));

        const newLastDocId = likeSnapshot.docs[likeSnapshot.docs.length - 1].id;
        return { blogs: enrichedBlogs, lastDocId: newLastDocId };
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
                is_liked: data.is_liked || false
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

        data.recipe.ingredients_list_fixed = this.fixIngredientSpelling(data.recipe.ingredients_list);

        const ingredientDetails = data.recipe.ingredients_list;

        // 🔹 Upload image và tính nutrition song song
        const [nutritionResult, uploadResult] = await Promise.all([
            EdamamIngredientService.getNutritionForList(ingredientDetails),
            file ? uploadImage(file.path) : Promise.resolve({ url: null })
        ]);
        data.image = uploadResult.url;
        const nutrition_facts = nutritionResult;

        // 🔹 Replace bad words + mark misspelled
        // data.title = this.cleanAndMark(data.title, dictionary);
        data.description_fixed = data.description;

        data.description = this.cleanAndMark(data.description, dictionary);
        // data.recipe.description = this.cleanAndMark(data.recipe.description, dictionary);


        // 🔹 Tạo Blog object
        const blog = new Blog({
            _id: docRef.id,
            user_id: data.user_id || 'unknown',
            title: data.title,
            recipe: data.recipe,
            created_at: data.created_at ? new Date(data.created_at) : new Date(),
        });


        blog.difficulty_score = 0;
        blog.description = data.description;
        blog.image_url = data.image;
        blog.recipe.image_url = data.image;
        blog.user_name = data.user_name || 'Anonymous';
        blog.recipe.difficulty_score = 0;
        blog.is_published = false; // Mặc định là true
        blog.description_fixed = data.description_fixed

        blog.recipe.seasoning = blog.recipe.seasoning || [];
        blog.recipe.nutrition_facts = nutrition_facts;
        blog.recipe.ingredients_list = data.recipe.ingredients_list;
        blog.recipe.ingredients_list_fixed = data.recipe.ingredients_list_fixed;
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


    static fixIngredientSpelling(ingredientsList) {
        const whitelist = ["shanks", "shank", "noodles"]

        const lowerWhitelist = whitelist.map(w => w.toLowerCase());

        return ingredientsList.map(item => {
            // Split ingredient into (empty) namePart + quantity/unit part
            const [namePart, ...rest] = item.split(/([0-9].*)/);

            // FIX: remove empty words to avoid "" turning into "a"
            const words = namePart
                .trim()
                .toLowerCase()
                .split(/\s+/)
                .filter(w => w.length > 0);

            const correctedWords = [];

            let i = 0;
            while (i < words.length) {
                let matched = false;

                for (const phrase of lowerWhitelist) {
                    const phraseWords = phrase.split(/\s+/);

                    if (i + phraseWords.length > words.length) continue;

                    const slice = words.slice(i, i + phraseWords.length);

                    if (slice.join(' ') === phrase) {
                        correctedWords.push(...slice);
                        i += phraseWords.length;
                        matched = true;
                        break;
                    }
                }

                if (!matched) {
                    correctedWords.push(spell.correct(words[i]));
                    i++;
                }
            }

            const quantityPart = rest.join('').trim();

            // FIX: remove leading space by trimming final string
            return (correctedWords.join(' ') + (quantityPart ? ' ' + quantityPart : '')).trim();
        });
    }




}






module.exports = BlogService;
