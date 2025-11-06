class User {
    constructor({
        _id,
        user_name,
        full_name,
        password,
        avatar_url = '',
        fridge = [],
        weekly_menu = {},
        ai_profile = {}, //first personality profile 
        weekly_shopping_list = {} //generated from weekly_menu //subtracting ingredients already in fridge
    }) {
        this._id = _id;
        this.user_name = user_name;
        this.full_name = full_name;
        this.password = password;
        this.avatar_url = avatar_url;
        this.fridge = fridge;      //[ingredient1: quantity, ingredient2: quantity, ...]
        this.weekly_menu = weekly_menu; // [monday: {recipe1, recipe2}, tuesday: {...}, ...]
        this.ai_profile = ai_profile;      // { taste_preferences: [], dietary_restrictions: [], cooking_skill_level: '', favorite_cuisines: [] }
        this.weekly_shopping_list = weekly_shopping_list; // [ingredient1: quantity, ingredient2: quantity, ...]
    }
}

module.exports = User;
