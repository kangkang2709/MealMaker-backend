const { db } = require('../config/firebase.config');
const { uploadImage } = require('../services/upload.service');
const RecipeLike = require('../model/recipeLike.model');


const recipeCollection = db.collection('recipes');
const recipeLikesCollection = db.collection('recipe_likes');

class RecipeService {

    // ==============================
    // CREATE MULTIPLE RECIPES
    // ==============================

    /**
    * Tìm recipe theo nguyên liệu, có fallback và pagination
    * @param {string} user_id
    * @param {string[]} ingredients - mảng tên nguyên liệu
    * @param {number} page
    * @param {number} size
    */
    static async findRecipesByIngredients(user_id, ingredients, page = 1, size = 10) {
        if (!Array.isArray(ingredients) || ingredients.length === 0) return [];

        const allRecipesSnap = await recipeCollection.get();

        // Chuẩn hóa search ingredients
        const searchSet = new Set(ingredients.map(i => i.toLowerCase().trim()));

        // Lấy liked set 1 lần duy nhất
        const likedSnap = await recipeLikesCollection.where('user_id', '==', user_id).get();
        const likedSet = new Set(likedSnap.docs.map(d => d.data().recipe_id));

        // Map recipes với số nguyên liệu trùng
        let recipes = allRecipesSnap.docs.map(doc => {
            const data = doc.data();

            // Lấy tên nguyên liệu từ ingredients_list
            const recipeSet = new Set(data.ingredients_list.map(line => line.split(' ')[0].toLowerCase().trim()));
            const matchCount = [...searchSet].filter(i => recipeSet.has(i)).length;

            return { ...data, id: doc.id, matchCount, liked: likedSet.has(data._id || doc.id) };
        });

        // Lọc ít nhất 1 nguyên liệu trùng
        recipes = recipes.filter(r => r.matchCount > 0);

        // Sắp xếp ưu tiên match nhiều nguyên liệu hơn
        recipes.sort((a, b) => b.matchCount - a.matchCount);

        // Fallback logic: tìm recipe match nhiều nhất có thể (3 → 2 → 1)
        let fallback = ingredients.length;
        let result = recipes.filter(r => r.matchCount >= fallback);
        while (result.length === 0 && fallback > 0) {
            fallback--;
            result = recipes.filter(r => r.matchCount >= fallback);
        }

        // Pagination
        const start = (page - 1) * size;
        const end = start + size;
        return result.slice(start, end);
    }


    static async createAllRecipes(recipesData) {
        const batch = db.batch();
        const createdRecipes = [];

        for (const recipe of recipesData) {
            const data = recipe;
            data.created_at = new Date();
            const docRef = recipeCollection.doc();
            batch.set(docRef, data);
            createdRecipes.push({ id: docRef.id, ...data });
        }

        await batch.commit();
        return createdRecipes;
    }

    // ==============================
    // CREATE SINGLE RECIPE
    // ==============================
    static async createRecipe(recipeData, file = null) {
        if (file) {
            const uploadResult = await uploadImage(file.path);
            recipeData.image_url = uploadResult.url;
        } else {
            recipeData.image_url = null;
        }

        const docRef = recipeCollection.doc();
        await docRef.set({
            ...recipeData,
            likeCount: 0, // initialize likes
            created_at: new Date(),
        });

        const doc = await docRef.get();
        return { id: doc.id, ...doc.data() };
    }


    static async createRecipe2(recipeData) {
        // recipeData.ingredients_list = recipeData.ingredients_list_fixed || recipeData.ingredients_list || [];
        const docRef = recipeCollection.doc(); // tạo doc mới với ID ngẫu nhiên
        const newRecipe = {
            _id: docRef.id,          // field _id sẽ lưu doc.id
            ...recipeData,
            likeCount: 0,
            created_at: new Date(),  // hoặc Firestore Timestamp
        };

        await docRef.set(newRecipe); // lưu _id vào Firestore

        return newRecipe;
    }



    // ==============================
    // UPDATE RECIPE
    // ==============================
    static async updateRecipe(id, updateData, files) {
        const docRef = recipeCollection.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) throw { code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' };

        if (files && files.length > 0) {
            const uploadResults = await Promise.all(files.map(file => uploadImage(file.path)));
            updateData.image_url = uploadResults.map(r => r.url);
        }

        updateData.updated_at = new Date();
        await docRef.update(updateData);

        const updatedDoc = await docRef.get();
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }

    // ==============================
    // GET ALL / GET ONE
    // ==============================
    static async getAllRecipes() {
        const snapshot = await recipeCollection.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    static async getRecipeById(id) {
        const doc = await recipeCollection.doc(id).get();
        if (!doc.exists) throw { code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' };
        return { id: doc.id, ...doc.data() };
    }

    // ==============================
    // LIKE RECIPE
    // ==============================
    static async likeRecipe(user_id, _id) { // _id là _id của recipe
        console.log('User:', user_id, 'Recipe _id:', _id);

        // Kiểm tra xem user đã like recipe chưa
        const likeQuery = await recipeLikesCollection
            .where('user_id', '==', user_id)
            .where('recipe_id', '==', _id) // dùng _id của recipe lưu trong field recipe_id
            .get();

        if (!likeQuery.empty) {
            return { success: false, message: 'Already liked this recipe' };
        }

        // Tạo document like mới
        const newLikeRef = recipeLikesCollection.doc();
        const newLike = {
            _id: newLikeRef.id, // _id của document like
            user_id: user_id,
            recipe_id: _id       // _id của recipe
        };

        await newLikeRef.set(newLike);

        // Cập nhật likeCount của recipe
        const recipeRef = recipeCollection.doc(_id); // doc của recipe
        await db.runTransaction(async (transaction) => {
            const recipeDoc = await transaction.get(recipeRef);
            if (recipeDoc.exists) {
                const newCount = (recipeDoc.data().likeCount || 0) + 1;
                transaction.update(recipeRef, { likeCount: newCount });
            }
        });

        return { success: true, message: 'Recipe liked successfully' };
    }



    // ==============================
    // UNLIKE RECIPE
    // ==============================
    static async unlikeRecipe(userId, recipeId) {
        const likeSnapshot = await recipeLikesCollection
            .where('user_id', '==', userId)
            .where('recipe_id', '==', recipeId)
            .get();

        if (likeSnapshot.empty) {
            return { success: false, message: 'You have not liked this recipe yet' };
        }

        const batch = db.batch();
        likeSnapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        // Update recipe like count
        const recipeRef = recipeCollection.doc(recipeId);
        await db.runTransaction(async (transaction) => {
            const recipeDoc = await transaction.get(recipeRef);
            if (recipeDoc.exists) {
                const newCount = Math.max((recipeDoc.data().likeCount || 0) - 1, 0);
                transaction.update(recipeRef, { likeCount: newCount });
            }
        });

        return { success: true, message: 'Recipe unliked successfully' };
    }

    // ==============================
    // GET USER LIKED RECIPES (FULL DATA)
    // ==============================
    static async getUserLikedRecipes(userId) {
        // Get liked recipe IDs
        const snapshot = await recipeLikesCollection.where('user_id', '==', userId).get();
        if (snapshot.empty) return [];

        const likedRecipeIds = snapshot.docs.map(doc => doc.data().recipe_id);

        // Fetch full recipes
        const recipeDocs = await Promise.all(
            likedRecipeIds.map(async (id) => {
                const recipeDoc = await recipeCollection.doc(id).get();
                if (!recipeDoc.exists) return null;
                return { id: recipeDoc.id, ...recipeDoc.data(), liked: true };
            })
        );

        // Filter out any null (deleted recipes)
        return recipeDocs.filter(r => r !== null);
    }

    // ==============================
    // MERGE ALL RECIPES WITH LIKE STATUS
    // ==============================
    static async getAllRecipesWithLikeStatus(userId) {
        const [allRecipes, likedRecipes] = await Promise.all([
            recipeCollection.get(),
            recipeLikesCollection.where('user_id', '==', userId).get()
        ]);

        const likedIds = new Set(likedRecipes.docs.map(doc => doc.data().recipe_id));

        return allRecipes.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            liked: likedIds.has(doc.id)
        }));
    }
}

module.exports = RecipeService;
