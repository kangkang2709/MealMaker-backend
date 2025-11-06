const axios = require("axios");


const EDAMAM_API_URL = process.env.EDAMAM_API_URL;
const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID;
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY;


class EdamamIngredientService {
    /**
     * 🔹 Call Edamam Nutrition Analysis API
     * @param {string} name - ingredient name
     * @param {number} quantity - quantity in grams
     */
    static async getRawNutrition(name, quantity = 100) {
        const payload = {
            title: "Ingredient nutrition lookup",
            ingr: [`${quantity} grams ${name}`],
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
}

module.exports = EdamamIngredientService;
