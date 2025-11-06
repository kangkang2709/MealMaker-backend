const axios = require("axios");

const USDA_SEARCH_API = "https://api.nal.usda.gov/fdc/v1/foods/search";
const USDA_KEY = "hAd9ulujfah1Sp8AFugbJcO31lUa3ZNwPILKRghg";

// Only pick these key nutrients
const TARGET_NUTRIENTS = [
    "Energy",
    "Protein",
    "Total lipid (fat)",
    "Carbohydrate, by difference"
];

class IngredientApiService {
    static async getIngredient(name) {
        try {
            const url = `${USDA_SEARCH_API}?query=${encodeURIComponent(name)}&api_key=${USDA_KEY}`;
            const { data } = await axios.get(url);
            const foods = data.foods || [];
            if (foods.length === 0) return null;

            // 1️⃣ Prefer "raw" or "fresh" item
            let food = foods.find(f =>
                f.description.toLowerCase().includes("raw") ||
                f.description.toLowerCase().includes("fresh")
            );
            if (!food) food = foods[0];

            // 2️⃣ Filter nutrients we care about
            const nutrients = (food.foodNutrients || []).filter(n =>
                TARGET_NUTRIENTS.includes(n.nutrientName)
            );

            // 3️⃣ Extract values cleanly
            const getValue = (nutrientName) => {
                const n = nutrients.find(n => n.nutrientName === nutrientName);
                return n ? n.value || 0 : 0;
            };

            return {
                id: food.fdcId,
                name: food.description,
                category: food.foodCategory || "Unknown",
                nutrition: {
                    calories: getValue("Energy"),
                    protein: getValue("Protein"),
                    fat: getValue("Total lipid (fat)"),
                    carb: getValue("Carbohydrate, by difference")
                }
            };
        } catch (err) {
            console.error("❌ USDA API Error:", err.message);
            return null;
        }
    }
}

module.exports = IngredientApiService;
