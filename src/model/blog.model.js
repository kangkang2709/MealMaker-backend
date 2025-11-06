// src/model/blog.model.js
class Blog {
    constructor({
        _id = null,
        user_id,
        title,
        receipt,   // id of the recipe
        reject_reason = '',
        created_at = new Date(),
    }) {
        this._id = _id;
        this.user_id = user_id;
        this.title = title;

        this.receipt = receipt;

        this.rating = 0;
        this.bad_rating = 0;

        this.reject_reason = reject_reason;
        this.created_at = created_at;
    }
}

module.exports = Blog;
