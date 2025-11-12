class User {
    constructor(
        user_name,
        full_name,
        password
    ) {
        this.user_name = user_name;
        this.full_name = full_name;
        this.password = password;
        this.avatar_url = '';

        this.fridge = {}; // { ingredient: quantity, ... }
        this.ai_profile = {
            region: [],
            favorite_dishes: [],
            favorite_ingredients: [],
            diet: [],
            cooking_skill_level: 0
        };

        this.weekly_shopping_list = {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: []
        };

        // ✅ Weekly menu chỉ lưu recipe_id
        this.weekly_menu = {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: []
        };
    }

    // Ví dụ phương thức thêm recipe_id vào ngày
    addRecipeToDay(day, recipe_id) {
        if (this.weekly_menu[day]) {
            this.weekly_menu[day].push(recipe_id);
        }
    }
}

module.exports = User;
