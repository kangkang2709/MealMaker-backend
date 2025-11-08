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
            throw new Error('User đã đánh giá blog này');
        }

        // Tạo BlogLike mới
        const docRef = blogLikeCollection.doc();
        const blogLike = {
            _id: docRef.id,
            user_id,
            blog_id,
            isGoodRating,
            score: isGoodRating ? score : null
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

        if (isGoodRating && score == 4){
            RecipeService.createRecipe2(blogData.recipe);
        }

        blog.evaluatePublicStatus();
        await blogRef.update({ ...blog });

        return blogLike;
    }

    /**
     * Undo vote
     * @param {Object} param0
     * @param {string} param0.user_id
     * @param {string} param0.blog_id
     */
    static async undoBlogLike({ user_id, blog_id }) {
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

        // Xóa vote
        await blogLikeCollection.doc(blogLikeDoc.id).delete();

        // Cập nhật blog
        const blogRef = blogCollection.doc(blog_id);
        const blogDoc = await blogRef.get();
        if (!blogDoc.exists) throw new Error('Blog không tồn tại');

        const blogData = blogDoc.data();
        const blog = new Blog({
            ...blogData,
            difficulty_score_distribution: blogData.difficulty_score_distribution || null
        });

        if (blogLikeData.isGoodRating) {
            blog.decrementRating(blogLikeData.score);
        } else {
            blog.decrementBadRating();
        }

        blog.evaluatePublicStatus();
        await blogRef.update({ ...blog });

        return { message: 'Vote đã được hủy', blogLike: blogLikeData };
    }
}

module.exports = BlogLikeService;
