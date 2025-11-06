class BlogLike {
    constructor({ _id, user_id, blog_id }) {
        this._id = _id;        // Unique identifier for this like
        this.user_id = user_id; // The ID of the user who liked the blog
        this.blog_id = blog_id; // The ID of the blog being liked
    }
}

module.exports = BlogLike;
