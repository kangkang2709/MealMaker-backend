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
            tags: [],
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

    addTag(tagName) {
        const tag = this.ai_profile.tags.find(t => t.tag_name === tagName);

        if (tag) {
            tag.score += 1;
        } else {
            this.ai_profile.tags.push({
                tag_name: tagName,
                score: 1
            });
        }
    }

    addTag(tagName) {
        const tag = this.ai_profile.tags.find(t => t.tag_name === tagName);

        if (tag) {
            tag.score += 1;
        } else {
            this.ai_profile.tags.push({
                tag_name: tagName,
                score: 1
            });
        }
    }

    setCookingSkillLevel(level) {
        this.ai_profile.cooking_skill_level = level;
    }

}

module.exports = User;
