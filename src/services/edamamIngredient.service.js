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

            console.log("✅ Edamam response received");
            return data;
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

            console.log("✅ Edamam response for list received");
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

module.exports = EdamamIngredientService;
