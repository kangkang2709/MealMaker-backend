// src/model/ingredient.model.js
class Ingredient {
    constructor({
        _id,
        name,
        category,
        image_url,
        nutrition = {},
        created_at,
        updated_at,
    }) {
        this._id = _id;
        this.name = name;
        this.category = category; // thịt, rau củ, gia vị, ...
        this.image_url = image_url;
        this.nutrition = nutrition; // {calories, protein, fat, carb}
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
}

module.exports = Ingredient;
