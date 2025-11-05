// src/model/blog.model.js
class Blog {
    constructor({
        _id = null,
        author_id,
        title,
        content,
        images = [],          // array of image URLs
        tags = [],            // array of strings
        created_at = new Date(),
        updated_at = new Date(),
    }) {
        this._id = _id;
        this.author_id = author_id;
        this.title = title;
        this.content = content;
        this.images = images;
        this.tags = tags;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
}

module.exports = Blog;
