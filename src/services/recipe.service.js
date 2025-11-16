const { db } = require('../config/firebase.config');
const { uploadImage } = require('../services/upload.service');
const RecipeLike = require('../model/recipeLike.model');
const recipeCollection = db.collection('recipes');
const recipeLikesCollection = db.collection('recipe_likes');

class RecipeService {
    /**
         * Tìm recipes theo list_tags, ưu tiên recipes match nhiều tag nhất
         * @param {string[]} tagsList - danh sách tags cần tìm
         * @param {string} userId - id user (để thêm trạng thái liked)
         * @returns {Promise<Array>} danh sách recipe
         */
    static async getTop10RecipesByTags(tagsList, userId) {
        if (!tagsList || tagsList.length === 0) return [];

        // 1. Lấy recipes có ít nhất 1 tag trong tagsList (max 10 tags vì firestore giới hạn)
        const querySnapshot = await recipeCollection
            .where('tags', 'array-contains-any', tagsList.slice(0, 10))
            .get();

        // 2. Lấy recipes liked của user
        const likedSnapshot = await recipeLikesCollection
            .where('user_id', '==', userId)
            .get();
        const likedIds = new Set(likedSnapshot.docs.map(doc => doc.data().recipe_id));

        // 3. Tính số lượng tag match và tạo mảng kết quả
        const recipes = [];
        querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            const matchedTagsCount = data.tags.filter(tag => tagsList.includes(tag)).length;
            if (matchedTagsCount > 0) { // đảm bảo match ít nhất 1 tag
                recipes.push({
                    id: doc.id,
                    ...data,
                    liked: likedIds.has(doc.id),
                    matchedTagsCount
                });
            }
        });

        // 4. Sắp xếp giảm dần theo số tag match
        recipes.sort((a, b) => b.matchedTagsCount - a.matchedTagsCount);

        // 5. Trả đúng 10 recipe đầu tiên
        return recipes.slice(0, 10);
    }

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


    static async getAllDocIds() {
        try {
            const snapshot = await recipeCollection.get(); // Lấy tất cả document trong collection
            const ids = snapshot.docs.map(doc => doc.id);  // Lấy ra chỉ ID của mỗi document
            console.log('All Recipe IDs:', ids);
            return ids;
        } catch (error) {
            console.error('Error fetching recipe IDs:', error);
            throw error;
        }
    }

    static async createAllRecipesLike(recipesLikeData) {
        const batch = db.batch();
        const createdRecipesLike = [];

        for (const recipeLike of recipesLikeData) {
            const data = { ...recipeLike }; // clone để không mutate input
            data._id = recipeLikesCollection.doc().id; // tạo id và gán cho _id

            const docRef = recipeLikesCollection.doc(data._id); // dùng _id vừa tạo cho docRef
            batch.set(docRef, data);
            createdRecipesLike.push(data);
        }

        await batch.commit(); // commit batch
        return createdRecipesLike; // trả về mảng đã tạo
    }



    /** 
    * Tìm recipe theo nguyên liệu, có fallback và pagination
    * @param {string} user_id
    * @param {string[]} ingredients - mảng tên nguyên liệu
    * @param {number} page
    * @param {number} size
    */
    static async findRecipesByIngredients(user_id, ingredients, page = 1, size = 20) {
        if (!Array.isArray(ingredients) || ingredients.length === 0) return [];

        const UserService = require('../services/user.service');
        const tags = await UserService.getTopTagNames(user_id); // ví dụ: ["sweet","salty","spicy"]
        const userTagSet = new Set(tags.map(t => t.toLowerCase().trim()));

        // Lấy tất cả recipes
        const allRecipesSnap = await recipeCollection.get();

        // Chuẩn hóa ingredients đầu vào của user
        const searchSet = new Set(ingredients.map(i => normalizeIngredientName(i)));

        // Lấy danh sách recipe đã like của user
        const likedSnap = await recipeLikesCollection.where('user_id', '==', user_id).get();
        const likedSet = new Set(likedSnap.docs.map(d => d.data().recipe_id));

        // Map recipes với số nguyên liệu trùng và tag trùng
        let recipes = allRecipesSnap.docs.map(doc => {
            const data = doc.data();

            // Chuẩn hóa nguyên liệu của recipe
            const recipeSet = new Set(data.ingredients_list.map(line =>
                normalizeIngredientName(line.replace(/[0-9]/g, '').trim())
            ));

            // Đếm số nguyên liệu trùng (multi-word)
            const matchCount = [...searchSet].filter(userIng =>
                [...recipeSet].some(recipeIng => recipeIng.includes(userIng))
            ).length;

            // Đếm số tag trùng với user
            const recipeTagSet = new Set((data.tags || []).map(t => t.toLowerCase().trim()));
            const tagMatchCount = [...recipeTagSet].filter(t => userTagSet.has(t)).length;

            return {
                ...data,
                id: doc.id,
                matchCount,
                tagMatchCount,
                liked: likedSet.has(data._id || doc.id)
            };
        });

        // Lọc ít nhất 1 nguyên liệu trùng
        recipes = recipes.filter(r => r.matchCount > 0);

        // Fallback: tìm recipe match nhiều nhất có thể
        let fallback = ingredients.length;
        let result = [];
        while (fallback > 0) {
            result = recipes.filter(r => r.matchCount >= fallback);
            if (result.length > 0) break;
            fallback--;
        }

        // Sắp xếp kết quả:
        // 1. matchCount giảm dần
        // 2. Nếu matchCount < total ingredients → tagMatchCount giảm dần
        // 3. Giữ thứ tự hiện tại nếu bằng nhau
        result.sort((a, b) => {
            if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
            if (b.matchCount < ingredients.length) {
                return b.tagMatchCount - a.tagMatchCount;
            }
            return 0;
        });

        // Pagination
        const start = (page - 1) * size;
        const end = start + size;
        return result.slice(start, end);
    }



    static async createAllRecipes(recipesData) {
        const batch = db.batch();
        const createdRecipes = [];

        for (const recipe of recipesData) {
            const data = { ...recipe }; // clone để không mutate input
            data._id = recipeCollection.doc().id; // tạo id và gán cho _id
            data.created_at = new Date();
            const docRef = recipeCollection.doc(data._id); // dùng _id vừa tạo cho docRef
            batch.set(docRef, data);
            createdRecipes.push(data);
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

        recipeData.ingredients_list = recipeData.ingredients_list_fixed || recipeData.ingredients_list;

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
    static async likeRecipe(user_id, _id) {
        const UserService = require('../services/user.service')

        // Kiểm tra xem user đã like recipe chưa
        const likeQuery = await recipeLikesCollection
            .where('user_id', '==', user_id)
            .where('recipe_id', '==', _id)
            .get();

        if (!likeQuery.empty) {
            return { success: false, message: 'Already liked this recipe' };
        }

        // Tạo document like mới
        const newLikeRef = recipeLikesCollection.doc();
        const newLike = {
            _id: newLikeRef.id,
            user_id: user_id,
            recipe_id: _id
        };

        await newLikeRef.set(newLike);

        // Cập nhật likeCount của recipe trong transaction
        let recipeTags = [];
        const recipeRef = recipeCollection.doc(_id);
        await db.runTransaction(async (transaction) => {
            const recipeDoc = await transaction.get(recipeRef);
            if (recipeDoc.exists) {
                const newCount = (recipeDoc.data().likeCount || 0) + 1;
                transaction.update(recipeRef, { likeCount: newCount });
                recipeTags = recipeDoc.data().tags || [];
            }
        });

        // Cập nhật tags cho user
        await UserService.addTagsList(user_id, recipeTags);

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



}
// Hàm chuẩn hóa tên nguyên liệu
function normalizeIngredientName(name) {
    name = name.toLowerCase().trim();
    name = name.replace(/[0-9]/g, '').trim();
    if (name.endsWith('es')) return name.slice(0, -2);
    if (name.endsWith('s')) return name.slice(0, -1);
    return name;
}
module.exports = RecipeService;
