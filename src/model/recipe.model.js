class Recipe {
    constructor({
        recipe_id,
        title,
        image_url = '',
        ingredients_list = [],
        instructions = '',
        time_minutes = 0,
        difficulty_score = 0,
        nutrition_facts = {},
        tags = []
    }) {
        this.recipe_id = recipe_id;                  // string
        this.title = title;                          // string
        this.image_url = image_url;                  // string (URL)
        this.ingredients_list = ingredients_list;    // array of strings
        this.instructions = instructions;            // string
        this.time_minutes = time_minutes;            // number

        this.difficulty_score = difficulty_score;

        // number
        this.nutrition_facts = {
            serving_size: nutrition_facts.serving_size || '',
            calories: nutrition_facts.calories || 0,
            protein_g: nutrition_facts.protein_g || 0,
            fat_total_g: nutrition_facts.fat_total_g || 0,
            carbohydrates_g: nutrition_facts.carbohydrates_g || 0,
            fiber_g: nutrition_facts.fiber_g || 0,
            sugar_g: nutrition_facts.sugar_g || 0
        };
        this.tags = tags;                            // array of strings
    }
}

module.exports = Recipe;
