// src/model/recipeLike.model.js
class RecipeLike {
    constructor({ _id, user_id, recipe_id, liked_at }) {
        this._id = _id;
        this.user_id = user_id;
        this.recipe_id = recipe_id;
        this.liked_at = liked_at;
    }
}

module.exports = RecipeLike;
