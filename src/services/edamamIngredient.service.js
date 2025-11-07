const axios = require("axios");

const EDAMAM_API_URL = process.env.EDAMAM_NUTRIENT_API_URL;
const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID;
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY;

class EdamamIngredientService {

    static async getRawNutrition(name, quantity = 100, unit = "grams") {
        const ingredientStr =
            typeof quantity === "string" ? `${quantity} ${name}` : `${quantity} ${unit} ${name}`;

        const payload = {
            title: "Ingredient nutrition lookup",
            ingr: [ingredientStr],
        };

        console.log("📦 Sending to Edamam:", payload);

        try {
            const { data } = await axios.post(
                `${EDAMAM_API_URL}?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}`,
                payload,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Content-Language": "en",
                    },
                }
            );

             const nutritionFacts = convertToNutritionFacts(data);
            return nutritionFacts;
        } catch (err) {
            console.error(
                "❌ Edamam API Error:",
                err.response?.data || err.message
            );

            throw new Error(
                err.response?.data?.message || "Ingredient not found"
            );
        }
    }

    /**
     * 🔹 Lấy dinh dưỡng tổng hợp cho nhiều nguyên liệu
     * @param {string[]} ingredientsList - ví dụ ["1 cup rice", "10 oz chickpeas"]
     */
    static async getNutritionForList(ingredientsList) {

           console.log(ingredientsList)

        if (!Array.isArray(ingredientsList) || ingredientsList.length === 0) {
            throw new Error("Ingredients list must be a non-empty array");
        }

        const payload = {
            title: "Recipe nutrition lookup",
            ingr: ingredientsList,
        };

        console.log("📦 Sending ingredient list to Edamam:", payload);

        try {
            const { data } = await axios.post(
                `${EDAMAM_API_URL}?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}`,
                payload,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Content-Language": "en",
                    },
                }
            );

             const nutritionFacts = convertToNutritionFacts(data);
            return nutritionFacts;
            return data; // data chứa calories, totalNutrients, totalWeight, etc.
        } catch (err) {
            console.error(
                "❌ Edamam API Error:",
                err.response?.data || err.message
            );
            throw new Error(
                err.response?.data?.message || "Ingredients not found"
            );
        }
    }
    
}
function convertToNutritionFacts(edamamData) {
    if (!edamamData?.ingredients || !edamamData.yield) {
        return {
            serving_size: "1 serving",
            calories: 0,
            protein_g: 0,
            fat_total_g: 0,
            carbohydrates_g: 0,
            fiber_g: 0,
            sugar_g: 0
        };
    }

    const total = {
        calories: 0,
        protein_g: 0,
        fat_total_g: 0,
        carbohydrates_g: 0,
        fiber_g: 0,
        sugar_g: 0
    };

    edamamData.ingredients.forEach(ingredient => {
        ingredient.parsed.forEach(item => {
            const nutrients = item.nutrients;

            total.calories += nutrients.ENERC_KCAL?.quantity || 0;
            total.protein_g += nutrients.PROCNT?.quantity || 0;
            total.fat_total_g += nutrients.FAT?.quantity || 0;
            total.carbohydrates_g += nutrients.CHOCDF?.quantity || 0;
            total.fiber_g += nutrients.FIBTG?.quantity || 0;
            total.sugar_g += nutrients.SUGAR?.quantity || 0;
        });
    });

    // Tính trên 1 khẩu phần
    const servings = edamamData.yield;
    const nutritionFacts = {
        serving_size: `1 serving (1/${servings} of recipe)`,
        calories: Math.round(total.calories / servings),
        protein_g: Math.round(total.protein_g / servings),
        fat_total_g: Math.round(total.fat_total_g / servings),
        carbohydrates_g: Math.round(total.carbohydrates_g / servings),
        fiber_g: Math.round(total.fiber_g / servings),
        sugar_g: Math.round(total.sugar_g / servings)
    };

    return nutritionFacts;
}

module.exports = EdamamIngredientService;
