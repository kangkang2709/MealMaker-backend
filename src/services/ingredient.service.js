const { db } = require('../config/firebase.config');
const { uploadImage } = require('../services/upload.service'); // ✅ đúng


const ingredientCollection = db.collection('ingredients');

class IngredientService {
    static async createIngredient(ingredientData, file) {
        if (file) {
            const { url } = await uploadImage(file.path);
            ingredientData.image_url = url;
        } else {
            ingredientData.image_url = '';
        }

        ingredientData.created_at = new Date();
        ingredientData.updated_at = new Date();

        const docRef = ingredientCollection.doc();
        await docRef.set(ingredientData);

        const doc = await docRef.get();
        return { id: doc.id, ...doc.data() };
    }

    static async updateIngredient(id, updateData, file) {
        const docRef = ingredientCollection.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) throw { code: 'INGREDIENT_NOT_FOUND', message: 'Ingredient not found' };

        if (file) {
            const { url } = await uploadImage(file.path);
            updateData.image_url = url;
        }

        updateData.updated_at = new Date();
        await docRef.update(updateData);

        const updatedDoc = await docRef.get();
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }

    static async getAllIngredients() {
        const snapshot = await ingredientCollection.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    static async getIngredientById(id) {
        const doc = await ingredientCollection.doc(id).get();
        if (!doc.exists) throw { code: 'INGREDIENT_NOT_FOUND', message: 'Ingredient not found' };
        return { id: doc.id, ...doc.data() };
    }
}

module.exports = IngredientService;
