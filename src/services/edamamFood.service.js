const axios = require("axios");

const FOOD_API_URL = "https://api.edamam.com/api/food-database/v2/parser";
const EDAMAM_FOOD_APP_ID = process.env.EDAMAM_FOOD_APP_ID;
const EDAMAM_FOOD_APP_KEY = process.env.EDAMAM_FOOD_APP_KEY;

class EdamamFoodService {
    /**
     * 🔍 Search food using Edamam Food Database Parser API
     * @param {object} params - query params: { ingr, brand, upc, nutritionType, health, category, calories, nutrients }
     */
    static async searchFood(params = {}) {
        try {
            const {
                ingr,
                brand,
                upc,
                nutritionType = "cooking",
                health,
                category,
                calories,
                nutrients,
            } = params;

            if (!ingr && !brand && !upc) {
                throw new Error("At least one of 'ingr', 'brand', or 'upc' is required.");
            }

            // Chuẩn bị query
            const query = {
                app_id: EDAMAM_FOOD_APP_ID,
                app_key: EDAMAM_FOOD_APP_KEY,
                nutritionType,
            };

            if (ingr) query.ingr = ingr;
            if (brand) query.brand = brand;
            if (upc) query.upc = upc;
            if (calories) query.calories = calories; // e.g. "100-300"
            if (category) query.category = category; // e.g. "generic-foods"
            if (health) query.health = health; // e.g. ["vegan", "gluten-free"]

            // nutrient filters: e.g. nutrients[FAT]=30, nutrients[PROCNT]=10+
            if (nutrients && typeof nutrients === "object") {
                for (const [key, val] of Object.entries(nutrients)) {
                    query[`nutrients[${key}]`] = val;
                }
            }

            const { data } = await axios.get(FOOD_API_URL, { params: query });
            return data;
        } catch (err) {
            console.error("❌ Edamam Food Parser API Error:", err.response?.data || err.message);
            throw new Error(err.response?.data?.message || err.message || "Failed to fetch food data");
        }
    }
}

module.exports = EdamamFoodService;
