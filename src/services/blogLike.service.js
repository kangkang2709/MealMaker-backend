// src/services/blogLike.service.js
const { db } = require('../config/firebase.config');
const Blog = require('../model/blog.model');

const blogCollection = db.collection('blogs');
const blogLikeCollection = db.collection('blogLikes');
const RecipeService = require('../services/recipe.service');

class BlogLikeService {

    /**
     * Thêm vote (positive hoặc negative)
     * @param {Object} param0
     * @param {string} param0.user_id
     * @param {string} param0.blog_id
     * @param {boolean} param0.isGoodRating
     * @param {number} param0.score (bắt buộc nếu isGoodRating = true)
     */

    static async createBlogLike({ user_id, blog_id, isGoodRating = true, score }) {
        if (isGoodRating && (score === undefined || score < 1 || score > 5)) {
            throw new Error('Score phải được cung cấp từ 1 đến 5 cho positive rating');
        }

        // Kiểm tra user đã vote chưa
        const snapshot = await blogLikeCollection
            .where('user_id', '==', user_id)
            .where('blog_id', '==', blog_id)
            .get();

        if (!snapshot.empty) {
            const existingLike = snapshot.docs[0].data();
            // Nếu isGoodRating khác null thì user đã vote
            if (existingLike.isGoodRating !== null && existingLike.isGoodRating !== undefined) {
                throw new Error('User đã đánh giá blog này');
            }
        }

        // Tạo BlogLike mới
        const docRef = blogLikeCollection.doc();
        const blogLike = {
            _id: docRef.id,
            user_id,
            blog_id,
            isGoodRating,
            score: isGoodRating ? score : null,
            is_liked: false,
        };
        await docRef.set(blogLike);

        // Lấy blog từ Firestore
        const blogRef = blogCollection.doc(blog_id);
        const blogDoc = await blogRef.get();
        if (!blogDoc.exists) throw new Error('Blog không tồn tại');

        const blogData = blogDoc.data();
        const blog = new Blog({
            ...blogData,
            difficulty_score_distribution: blogData.difficulty_score_distribution || null
        });

        // Cập nhật vote
        if (isGoodRating) {
            blog.incrementRating(score);
        } else {
            blog.incrementBadRating();
        }

        if (isGoodRating && score == 4) {
            RecipeService.createRecipe2(blogData.recipe);
        }

        blog.evaluatePublicStatus();
        await blogRef.update({ ...blog });

        return blogLike;
    }

    static async updateBlogLikeStatus({ user_id, blog_id, is_liked }) {
        // Kiểm tra giá trị hợp lệ
        if (typeof is_liked !== 'boolean') {
            throw new Error('Giá trị is_liked phải là boolean');
        }

        // Tìm blogLike của user và blog
        const snapshot = await blogLikeCollection
            .where('user_id', '==', user_id)
            .where('blog_id', '==', blog_id)
            .get();

        if (snapshot.empty) {
            // Nếu chưa có, tạo mới BlogLike với isGoodRating = null
            const docRef = blogLikeCollection.doc();
            const blogLike = {
                _id: docRef.id,
                user_id,
                blog_id,
                isGoodRating: null, // chưa vote
                score: null,
                is_liked,
            };
            await docRef.set(blogLike);
            return { message: 'Tạo mới BlogLike và cập nhật trạng thái is_liked thành công', id: docRef.id };
        } else {
            const doc = snapshot.docs[0];
            const docRef = blogLikeCollection.doc(doc.id);
            await docRef.update({ is_liked });
            return { message: `Cập nhật trạng thái is_liked = ${is_liked} thành công`, id: doc.id };
        }
    }


    /**
     * Undo vote
     * @param {Object} param0
     * @param {string} param0.user_id
     * @param {string} param0.blog_id
     */
    static async undoBlogVote({ user_id, blog_id }) {
        // Tìm BlogLike của user
        const snapshot = await blogLikeCollection
            .where('user_id', '==', user_id)
            .where('blog_id', '==', blog_id)
            .get();

        if (snapshot.empty) {
            throw new Error('Không tìm thấy vote của user này trên blog');
        }

        const blogLikeDoc = snapshot.docs[0];
        const blogLikeData = blogLikeDoc.data();

        // Lấy blog từ Firestore
        const blogRef = blogCollection.doc(blog_id);
        const blogDoc = await blogRef.get();
        if (!blogDoc.exists) throw new Error('Blog không tồn tại');

        const blogData = blogDoc.data();
        const blog = new Blog({
            ...blogData,
            difficulty_score_distribution: blogData.difficulty_score_distribution || null
        });

        // Nếu vote là positive hoặc negative, giảm điểm trên blog
        if (blogLikeData.isGoodRating) {
            blog.decrementRating(blogLikeData.score);
        } else {
            blog.decrementBadRating();
        }

        blog.evaluatePublicStatus();
        await blogRef.update({ ...blog });

        // Cập nhật BlogLike: reset vote nhưng giữ is_liked
        await blogLikeCollection.doc(blogLikeDoc.id).update({
            isGoodRating: null,
            score: null
        });

        return { message: 'Vote đã được hủy nhưng like vẫn còn', blogLikeId: blogLikeDoc.id };
    }

}

module.exports = BlogLikeService;
