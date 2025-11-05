// src/model/ingredient.model.js
class Ingredient {
    constructor({
        _id = null,
        name,
        category,
        image_url = '',
        nutrition = { calories: 0, protein: 0, fat: 0, carb: 0 },
        created_at = new Date(),
        updated_at = new Date(),
    }) {
        this._id = _id;
        this.name = name;
        this.category = category;
        this.image_url = image_url;
        this.nutrition = nutrition;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
}

module.exports = Ingredient;
