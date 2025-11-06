class BlogLike {
    constructor({ _id, user_id, blog_id, isGoodRating = true, score = null }) {
        this._id = _id;           // Firestore doc ID
        this.user_id = user_id;
        this.blog_id = blog_id;
        this.isGoodRating = isGoodRating;
        this.score = isGoodRating ? score : null; // score chỉ dùng cho positive rating
    }
}

module.exports = BlogLike;
