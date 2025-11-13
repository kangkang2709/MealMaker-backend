const { db } = require('../config/firebase.config');
const { uploadImage } = require('../services/upload.service'); // ✅ đúng
const User = require('../model/user.model')
const userCollection = db.collection('users');
const RecipeService = require('../services/recipe.service');

class UserService {

    static async updateFridge(userId, fridgeData) {
        const docRef = userCollection.doc(userId);
        const doc = await docRef.get();
        if (!doc.exists) throw new Error('User not found');

        if (!fridgeData || typeof fridgeData !== 'object') {
            throw new Error('Invalid fridge data');
        }

        // Ghi đè toàn bộ fridge
        await docRef.update({ fridge: fridgeData });

        const updatedDoc = await docRef.get();
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }

    static async updateWeeklyMenuWithDetails(userId, recipeIds) {
        const docRef = userCollection.doc(userId);
        const doc = await docRef.get();
        if (!doc.exists) throw new Error('User not found');

        if (!Array.isArray(recipeIds) || recipeIds.length !== 14) {
            throw new Error('Recipe list must contain exactly 14 recipe IDs');
        }

        const daysOfWeek = [
            'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
        ];

        const weeklyMenu = {};

        for (let i = 0; i < daysOfWeek.length; i++) {
            const dailyIds = recipeIds.slice(i * 2, i * 2 + 2);
            const dailyRecipes = await Promise.all(
                dailyIds.map(async id => {
                    const recipe = await RecipeService.getRecipeById(id);
                    return {
                        recipe_id: recipe.id,
                        title: recipe.title,
                        ingredients_list: recipe.ingredients_list,
                        seasoning: recipe.seasoning
                    };
                })
            );
            weeklyMenu[daysOfWeek[i]] = dailyRecipes;
        }

        // 1️⃣ Update weekly_menu
        await docRef.update({ weekly_menu: weeklyMenu });

        // 2️⃣ Gọi hàm khác ngay sau khi update
        // Ví dụ: cập nhật weekly shopping list
        await UserService.updateWeeklyShoppingList(userId);

        // 3️⃣ Lấy lại dữ liệu đã update
        const updatedDoc = await docRef.get();
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }




    static async updateWeeklyShoppingList(userId) {
        const userDoc = await userCollection.doc(userId).get();
        if (!userDoc.exists) throw new Error('User not found');

        const user = userDoc.data();
        const updatedShoppingList = {};



        for (const day of Object.keys(user.weekly_menu)) {
            const recipesForDay = user.weekly_menu[day] || [];
            const tempIngredients = {}; // key = name_unit
            const seasoningSet = new Set();

            for (const recipe of recipesForDay) {
                // const recipeId = recipeDay.recipe_id;
                // const recipe = await RecipeService.getRecipeById(recipeId);
                if (!recipe || !recipe.ingredients_list) continue;

                // Xử lý nguyên liệu
                for (const line of recipe.ingredients_list) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length < 2) continue;

                    const qtyUnit = parts[parts.length - 1].toLowerCase(); // "100g"
                    const name = parts.slice(0, parts.length - 1).join(' ').toLowerCase(); // "sliced tomato"

                    const match = qtyUnit.match(/^(\d+(\.\d+)?)([a-zA-Z]+)$/);
                    if (!match) continue;

                    const quantity = parseFloat(match[1]);
                    const unit = match[3];

                    const key = `${name}_${unit}`;
                    if (!tempIngredients[key]) {
                        tempIngredients[key] = { name, quantity, unit };
                    } else {
                        tempIngredients[key].quantity += quantity;
                    }
                }

                // Xử lý seasoning (gộp lại, loại trùng, không trừ fridge)
                if (recipe.seasoning) {
                    for (const s of recipe.seasoning) {
                        const names = getSeasoningName(s); // trả về mảng
                        names.forEach(n => seasoningSet.add(n));
                    }
                }
            }

            // Trừ fridge và chuẩn hóa key theo fridge (nguyên liệu)
            const shoppingListForDay = {};
            for (const key in tempIngredients) {
                let { name, quantity, unit } = tempIngredients[key];

                // Kiểm tra fridge
                let fridgeQty = 0;
                const fridgeKey = Object.keys(user.fridge || {}).find(fk =>
                    normalizeIngredientName(fk) === normalizeIngredientName(name)
                );
                if (fridgeKey) {
                    const fridgeMatch = user.fridge[fridgeKey].match(/^(\d+(\.\d+)?)([a-zA-Z]+)$/);
                    if (fridgeMatch) {
                        const fridgeValue = parseFloat(fridgeMatch[1]);
                        const fridgeUnit = fridgeMatch[3].toLowerCase();
                        if (fridgeUnit === unit.toLowerCase()) fridgeQty = fridgeValue;
                    }
                    name = fridgeKey; // chuẩn hóa theo fridge
                }

                const qtyNeeded = Math.max(quantity - fridgeQty, 0);
                if (qtyNeeded > 0) shoppingListForDay[name] = `${qtyNeeded}${unit}`;
            }

            updatedShoppingList[day] = {
                ingredients: shoppingListForDay,
                seasoning: Array.from(seasoningSet)
            };
        }

        // Cập nhật vào firestore
        await userCollection.doc(userId).update({ weekly_shopping_list: updatedShoppingList });

        const updatedDoc = await userCollection.doc(userId).get();
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }


    static async getAllDocIds() {
        try {
            const snapshot = await userCollection.get(); // Lấy tất cả document trong collection
            const ids = snapshot.docs.map(doc => doc.id);  // Lấy ra chỉ ID của mỗi document
            console.log('All User IDs:', ids);
            return ids;
        } catch (error) {
            console.error('Error fetching User IDs:', error);
            throw error;
        }
    }

    // Cập nhật AI profile
    static async updateAIProfile(userId, ai_profile) {
        const docRef = userCollection.doc(userId);
        const doc = await docRef.get();
        if (!doc.exists) throw new Error('User not found');

        // Flatten fields để update từng key trong map ai_profile
        const updateData = {
            updated_at: new Date()
        };

        if (ai_profile.region !== undefined) updateData["ai_profile.region"] = ai_profile.region;
        if (ai_profile.favorite_dishes !== undefined) updateData["ai_profile.favorite_dishes"] = ai_profile.favorite_dishes;
        if (ai_profile.favorite_ingredients !== undefined) updateData["ai_profile.favorite_ingredients"] = ai_profile.favorite_ingredients;
        if (ai_profile.diet !== undefined) updateData["ai_profile.diet"] = ai_profile.diet;
        if (ai_profile.cooking_skill_level !== undefined) updateData["ai_profile.cooking_skill_level"] = ai_profile.cooking_skill_level;


        await docRef.update(updateData);

        const updatedDoc = await docRef.get();
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }

    // Cập nhật fridge (tủ lạnh)








    static async login(user_name, password) {
        const snapshot = await userCollection.where('user_name', '==', user_name).get();

        if (snapshot.empty) {
            throw new Error('User not found');
        }

        const doc = snapshot.docs[0];
        const user = doc.data();

        if (user.password !== password) {
            throw new Error('Invalid password');
        }

        return { id: doc.id, ...user };
    }


    static async createUser(userData, file) {
        const newUser = new User(userData.user_name, userData.full_name, userData.password);


        if (file) {
            const uploadResult = await uploadImage(file.path);
            newUser.avatar_url = uploadResult.url; // chỉ 1 ảnh
        } else {
            newUser.avatar_url = null;
        }

        const docRef = userCollection.doc();
        newUser._id = docRef.id;
        const userPlainObject = { ...newUser };

        await docRef.set(userPlainObject);

        const doc = await docRef.get();
        return { id: doc.id, ...doc.data() };
    }



    static async createAllUser(users) {
        const createdUsers = [];

        for (const user of users) {
            const docRef = userCollection.doc(); // tự generate ID
            // Gán _id bằng ID của Firestore
            const userWithId = { _id: docRef.id, ...user };
            await docRef.set(userWithId); // lưu cả _id vào Firestore
            createdUsers.push(userWithId);
        }

        return createdUsers;
    }




    // Cập nhật user
    static async updateUser(id, updateData, file) {
        const docRef = userCollection.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) throw { code: 'USER_NOT_FOUND', message: 'User not found' };

        if (file) {
            const { url } = await uploadImage(file.path);
            updateData.avatar_url = url;
        }

        await docRef.update(updateData);

        const updatedDoc = await docRef.get();
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }

    // Lấy tất cả user
    static async getAllUsers() {
        const snapshot = await userCollection.get();
        const users = [];
        snapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
        return users;
    }

    // Lấy user theo ID
    static async getUserById(id) {
        const docRef = userCollection.doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error('User not found');
        }

        return { id: doc.id, ...doc.data() };
    }

    // Xóa user
    static async deleteUser(id) {
        const docRef = userCollection.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) throw { code: 'USER_NOT_FOUND', message: 'User not found' };
        await docRef.delete();
        return { message: 'User deleted successfully' };
    }
}
function normalizeIngredientName(name) {
    name = name.toLowerCase().trim();
    if (name.endsWith('es')) return name.slice(0, -2);
    if (name.endsWith('s')) return name.slice(0, -1);
    return name;
}


// Hàm tách tên seasoning (bỏ số lượng/unit đầu)
function getSeasoningName(seasoningLine) {
    let lower = seasoningLine.toLowerCase();

    // Chuẩn hóa: thay & hoặc + bằng dấu cách
    lower = lower.replace(/&|\+/g, ' ');

    // Loại bỏ "to taste" vì không phải tên gia vị
    lower = lower.replace(/\bto taste\b/g, '').trim();

    if (lower.includes('salt') && lower.includes('pepper')) return ['salt', 'black pepper'];
    if (lower.includes('salt')) return ['salt'];

    const parts = lower.split(' ');
    const nameParts = parts.filter(p => isNaN(parseFloat(p)) && !['tbsp', 'tsp', 'cup', 'ml', 'g', 'unit'].includes(p));
    return nameParts.length > 0 ? [nameParts.join(' ').trim()] : [];
}

module.exports = UserService;
