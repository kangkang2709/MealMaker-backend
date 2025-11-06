const { db } = require('../config/firebase.config');
const { uploadImage } = require('../services/upload.service'); // ✅ đúng


const recipeCollection = db.collection('recipes');

class RecipeService {

    static async createAllRecipes(recipesData) {
        const batch = db.batch();
        const createdRecipes = [];

        for (const recipe of recipesData) {
            // If recipe is a class instance with toJSON:
            // const data = recipe.toJSON();
            // Otherwise, if it's already a plain object:
            const data = recipe;

            const docRef = recipeCollection.doc();
            batch.set(docRef, data);
            createdRecipes.push({ id: docRef.id, ...data });
        }

        await batch.commit();
        return createdRecipes;
    }




    static async createRecipe(recipeData, files) {
        // Upload tất cả ảnh nếu có
        if (files && files.length > 0) {
            const uploadResults = await Promise.all(
                files.map(file => uploadImage(file.path))
            );
            recipeData.images = uploadResults.map(r => r.url);
        } else {
            recipeData.images = [];
        }


        const docRef = recipeCollection.doc();
        await docRef.set(recipeData);

        const doc = await docRef.get();
        return { id: doc.id, ...doc.data() };
    }

    static async updateRecipe(id, updateData, files) {
        const docRef = recipeCollection.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) throw { code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' };

        if (files && files.length > 0) {
            const uploadResults = await Promise.all(
                files.map(file => uploadImage(file.path))
            );
            updateData.images = uploadResults.map(r => r.url);
        }

        updateData.updated_at = new Date();
        await docRef.update(updateData);

        const updatedDoc = await docRef.get();
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }

    static async getAllRecipes() {
        const snapshot = await recipeCollection.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    static async getRecipeById(id) {
        const doc = await recipeCollection.doc(id).get();
        if (!doc.exists) throw { code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' };
        return { id: doc.id, ...doc.data() };
    }
}

module.exports = RecipeService;
