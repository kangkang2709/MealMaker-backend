const { db } = require('../config/firebase.config');
const { uploadImage } = require('../services/upload.service'); // ✅ đúng
const User = require('../model/user.model')
const userCollection = db.collection('users');
const RecipeService = require('../services/recipe.service');

class UserService {


    // Tăng cooking skill
    static async changeCookingSkill(userId, delta) {
        const docRef = userCollection.doc(userId);
        const doc = await docRef.get();
        if (!doc.exists) throw new Error("User not found");

        const user = doc.data();
        const ai = user.ai_profile || { cooking_skill_level: 0 };
        let newLevel = (ai.cooking_skill_level || 0) + delta;

        // ⭐ Clamp giá trị: min 0, max 5
        if (newLevel < 0) newLevel = 0;
        if (newLevel > 5) newLevel = 5;

        ai.cooking_skill_level = newLevel;

        await docRef.update({
            'ai_profile.cooking_skill_level': ai.cooking_skill_level,
            updated_at: new Date()
        });

        return { cooking_skill_level: ai.cooking_skill_level };
    }





    static async updateWeeklyShoppingList(userId) {
        const userDoc = await userCollection.doc(userId).get();
        if (!userDoc.exists) throw new Error('User not found');

        const user = userDoc.data();
        const updatedShoppingList = {};


        const today = new Date(
            new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
        );
        // const today = new Date();
        let todayIndex = today.getDay();
        todayIndex = todayIndex === 0 ? 6 : todayIndex - 1;

        console.log('Today index:', todayIndex);

        const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

        const fridgeLeft = { ...user.fridge };

        // Lưu tổng tích lũy từ hôm nay → cuối tuần
        const futureTotals = {};

        // Lưu phần cần mua từng ngày (sau khi trừ fridge)
        const dailyNeeds = {};

        // 1️⃣ Tính nguyên liệu cần mua từng ngày (sau khi trừ fridge)
        for (let i = 0; i < dayOrder.length; i++) {
            const day = dayOrder[i];
            const recipesForDay = user.weekly_menu[day] || [];
            const tempIngredients = {};
            const seasoningSet = new Set();

            // Gộp nguyên liệu trong ngày
            for (const recipe of recipesForDay) {
                if (!recipe || !recipe.ingredients_list) continue;
                for (const line of recipe.ingredients_list) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length < 2) continue;
                    const qtyUnit = parts[parts.length - 1].toLowerCase();
                    const name = parts.slice(0, parts.length - 1).join(' ').toLowerCase();
                    const match = qtyUnit.match(/^(\d+(\.\d+)?)([a-zA-Z]*)$/);
                    if (!match) continue;
                    const quantity = parseFloat(match[1]);
                    const unit = match[3] || 'g';
                    const key = `${name}_${unit}`;
                    if (!tempIngredients[key]) tempIngredients[key] = { name, quantity, unit };
                    else tempIngredients[key].quantity += quantity;
                }
                if (recipe.seasoning) {
                    for (const s of recipe.seasoning) {
                        const names = getSeasoningName(s);
                        names.forEach(n => seasoningSet.add(n));
                    }
                }
            }

            const ingredientsToday = {};
            const isTodayOrLater = i >= todayIndex;

            if (isTodayOrLater) {
                for (const key in tempIngredients) {
                    let { name, quantity, unit } = tempIngredients[key];
                    let qtyNeeded = quantity;

                    // Trừ tủ lạnh
                    let fridgeQty = 0;
                    const fridgeKey = Object.keys(fridgeLeft || {}).find(fk =>
                        normalizeIngredientName(fk) === normalizeIngredientName(name)
                    );
                    if (fridgeKey) {
                        const fridgeMatch = fridgeLeft[fridgeKey].match(/^(\d+(\.\d+)?)([a-zA-Z]*)$/);
                        if (fridgeMatch) {
                            const fridgeValue = parseFloat(fridgeMatch[1]);
                            const fridgeUnit = fridgeMatch[3] || 'g';
                            if (fridgeUnit.toLowerCase() === unit.toLowerCase()) fridgeQty = fridgeValue;
                        }

                        if (fridgeQty >= qtyNeeded) {
                            fridgeLeft[fridgeKey] = `${fridgeQty - qtyNeeded}${unit}`;
                            qtyNeeded = 0;
                        } else {
                            qtyNeeded -= fridgeQty;
                            fridgeLeft[fridgeKey] = `0${unit}`;
                        }
                    }

                    if (qtyNeeded > 0) ingredientsToday[name] = `${qtyNeeded}${unit}`;

                    // Cập nhật futureTotals tích lũy
                    if (!futureTotals[key]) futureTotals[key] = qtyNeeded;
                    else futureTotals[key] += qtyNeeded;
                }

                dailyNeeds[day] = { ingredients: ingredientsToday, seasoning: Array.from(seasoningSet) };
            } else {
                dailyNeeds[day] = { ingredients: {}, seasoning: Array.from(seasoningSet) };
            }
        }

        // 2️⃣ Gán totals cho từng ngày (từ hôm nay → cuối tuần)
        // 2️⃣ Gán totals cho từng ngày (từ hôm nay → cuối tuần)
        let runningTotals = {}; // lưu theo key=name_unit
        for (let i = todayIndex; i < dayOrder.length; i++) {
            const day = dayOrder[i];
            const todayIngredients = dailyNeeds[day].ingredients;

            // Cập nhật runningTotals
            for (const key in futureTotals) {
                if (!runningTotals[key]) runningTotals[key] = 0;
            }

            for (const key in futureTotals) {
                const [name, unit] = key.split('_');
                const qtyTodayStr = todayIngredients[name]; // dạng "2kg" hoặc "50g"
                let qtyToday = 0;
                if (qtyTodayStr) {
                    const match = qtyTodayStr.match(/^(\d+(\.\d+)?)([a-zA-Z]*)$/);
                    if (match) qtyToday = parseFloat(match[1]);
                }
                runningTotals[key] += qtyToday;
            }

            // Chỉ giữ những món >0 và đúng unit
            const totals = {};
            for (const key in runningTotals) {
                if (runningTotals[key] > 0) {
                    const [name, unit] = key.split('_');
                    totals[name] = `${runningTotals[key]}${unit}`;
                }
            }

            // Chỉ giữ ingredients >0
            const filteredIngredients = {};
            for (const ing in todayIngredients) {
                const match = todayIngredients[ing].match(/^(\d+(\.\d+)?)([a-zA-Z]*)$/);
                if (match && parseFloat(match[1]) > 0) filteredIngredients[ing] = todayIngredients[ing];
            }

            updatedShoppingList[day] = {
                ingredients: filteredIngredients,
                totals,
                seasoning: dailyNeeds[day].seasoning
            };
        }


        await userCollection.doc(userId).update({ weekly_shopping_list: updatedShoppingList });
        const updatedDoc = await userCollection.doc(userId).get();
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }


    static async subtractFridgeForDayRemove(userId, targetDay) {
        const userDoc = await userCollection.doc(userId).get();
        if (!userDoc.exists) throw new Error("User not found");

        const user = userDoc.data();
        const fridgeLeft = { ...user.fridge };
        const recipesForDay = user.weekly_menu[targetDay] || [];

        let isChanged = false; // flag kiểm tra có thay đổi fridge không

        for (const recipe of recipesForDay) {
            if (!recipe?.ingredients_list) continue;

            for (const line of recipe.ingredients_list) {
                const parts = line.trim().split(" ");
                const qtyUnit = parts.pop();
                const ingNameRaw = parts.join(" ");
                const ingName = normalizeIngredientName(ingNameRaw);

                const neededQty = parseFloat(qtyUnit);
                const neededUnit = qtyUnit.replace(/[0-9.]/g, "");

                const key = Object.keys(fridgeLeft).find(
                    k => normalizeIngredientName(k) === ingName
                );
                if (!key) continue;

                const oldQty = parseFloat(fridgeLeft[key] || "0");
                const oldUnit = fridgeLeft[key].replace(/[0-9.]/g, "");

                if (oldUnit !== neededUnit || oldQty <= neededQty) {
                    delete fridgeLeft[key];
                    isChanged = true;
                } else {
                    fridgeLeft[key] = (oldQty - neededQty) + neededUnit;
                    isChanged = true;
                }
            }
        }

        // Cập nhật lại fridge trong database
        await userCollection.doc(userId).update({ fridge: fridgeLeft });

        // Nếu có thay đổi → gọi hàm khác, truyền targetDay
        if (isChanged && typeof this.onFridgeChanged === "function") {
            await UserService.updateWeeklyShoppingListaAftersubtractFridge(userId, targetDay);
        }

        return { id: userId, fridge: fridgeLeft };
    }

    static async updateWeeklyShoppingListaAftersubtractFridge(userId, targetDay) {
        const userDoc = await userCollection.doc(userId).get();
        if (!userDoc.exists) throw new Error('User not found');

        const user = userDoc.data();
        const updatedShoppingList = {};

        const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

        // Xác định index bắt đầu
        let startIndex;
        if (targetDay) {
            const normalizedDay = targetDay.toLowerCase();
            startIndex = dayOrder.indexOf(normalizedDay);
            if (startIndex === -1) throw new Error('Invalid target day');

            if (normalizedDay === 'sunday') {
                // Chủ nhật → không cập nhật gì
                await userCollection.doc(userId).update({ weekly_shopping_list: {} });
                const updatedDoc = await userCollection.doc(userId).get();
                return { id: updatedDoc.id, ...updatedDoc.data() };
            }

            // Bắt đầu từ ngày tiếp theo của targetDay
            startIndex = startIndex + 1;
        } else {
            // Mặc định là hôm nay
            const today = new Date();
            let todayIndex = today.getDay(); // 0=Sunday, 1=Monday ...
            startIndex = todayIndex === 0 ? 6 : todayIndex - 1; // chuyển Sunday=6
        }

        const fridgeLeft = { ...user.fridge };
        const futureTotals = {};
        const dailyNeeds = {};

        // 1️⃣ Tính nguyên liệu cần mua từng ngày (sau khi trừ fridge)
        for (let i = 0; i < dayOrder.length; i++) {
            const day = dayOrder[i];
            const recipesForDay = user.weekly_menu[day] || [];
            const tempIngredients = {};
            const seasoningSet = new Set();

            for (const recipe of recipesForDay) {
                if (!recipe || !recipe.ingredients_list) continue;
                for (const line of recipe.ingredients_list) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length < 2) continue;
                    const qtyUnit = parts[parts.length - 1].toLowerCase();
                    const name = parts.slice(0, parts.length - 1).join(' ').toLowerCase();
                    const match = qtyUnit.match(/^(\d+(\.\d+)?)([a-zA-Z]*)$/);
                    if (!match) continue;
                    const quantity = parseFloat(match[1]);
                    const unit = match[3] || 'g';
                    const key = `${name}_${unit}`;
                    if (!tempIngredients[key]) tempIngredients[key] = { name, quantity, unit };
                    else tempIngredients[key].quantity += quantity;
                }
                if (recipe.seasoning) {
                    for (const s of recipe.seasoning) {
                        const names = getSeasoningName(s);
                        names.forEach(n => seasoningSet.add(n));
                    }
                }
            }

            const ingredientsToday = {};
            const isStartOrLater = i >= startIndex;

            if (isStartOrLater) {
                for (const key in tempIngredients) {
                    let { name, quantity, unit } = tempIngredients[key];
                    let qtyNeeded = quantity;

                    // Trừ tủ lạnh
                    let fridgeQty = 0;
                    const fridgeKey = Object.keys(fridgeLeft || {}).find(fk =>
                        normalizeIngredientName(fk) === normalizeIngredientName(name)
                    );
                    if (fridgeKey) {
                        const fridgeMatch = fridgeLeft[fridgeKey].match(/^(\d+(\.\d+)?)([a-zA-Z]*)$/);
                        if (fridgeMatch) {
                            const fridgeValue = parseFloat(fridgeMatch[1]);
                            const fridgeUnit = fridgeMatch[3] || 'g';
                            if (fridgeUnit.toLowerCase() === unit.toLowerCase()) fridgeQty = fridgeValue;
                        }

                        if (fridgeQty >= qtyNeeded) {
                            fridgeLeft[fridgeKey] = `${fridgeQty - qtyNeeded}${unit}`;
                            qtyNeeded = 0;
                        } else {
                            qtyNeeded -= fridgeQty;
                            fridgeLeft[fridgeKey] = `0${unit}`;
                        }
                    }

                    if (qtyNeeded > 0) ingredientsToday[name] = `${qtyNeeded}${unit}`;

                    // Cập nhật futureTotals tích lũy
                    if (!futureTotals[key]) futureTotals[key] = qtyNeeded;
                    else futureTotals[key] += qtyNeeded;
                }

                dailyNeeds[day] = { ingredients: ingredientsToday, seasoning: Array.from(seasoningSet) };
            } else {
                dailyNeeds[day] = { ingredients: {}, seasoning: Array.from(seasoningSet) };
            }
        }

        // 2️⃣ Gán totals cho từng ngày (từ startIndex → cuối tuần)
        let runningTotals = {};
        for (let i = startIndex; i < dayOrder.length; i++) {
            const day = dayOrder[i];
            const todayIngredients = dailyNeeds[day].ingredients;

            for (const key in futureTotals) {
                if (!runningTotals[key]) runningTotals[key] = 0;
            }

            for (const key in futureTotals) {
                const [name, unit] = key.split('_');
                const qtyTodayStr = todayIngredients[name];
                let qtyToday = 0;
                if (qtyTodayStr) {
                    const match = qtyTodayStr.match(/^(\d+(\.\d+)?)([a-zA-Z]*)$/);
                    if (match) qtyToday = parseFloat(match[1]);
                }
                runningTotals[key] += qtyToday;
            }

            const totals = {};
            for (const key in runningTotals) {
                if (runningTotals[key] > 0) {
                    const [name, unit] = key.split('_');
                    totals[name] = `${runningTotals[key]}${unit}`;
                }
            }

            const filteredIngredients = {};
            for (const ing in todayIngredients) {
                const match = todayIngredients[ing].match(/^(\d+(\.\d+)?)([a-zA-Z]*)$/);
                if (match && parseFloat(match[1]) > 0) filteredIngredients[ing] = todayIngredients[ing];
            }

            updatedShoppingList[day] = {
                ingredients: filteredIngredients,
                totals,
                seasoning: dailyNeeds[day].seasoning
            };
        }

        await userCollection.doc(userId).update({ weekly_shopping_list: updatedShoppingList });
        const updatedDoc = await userCollection.doc(userId).get();
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }


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
        const data = updatedDoc.data();

        console.log('Updated user data:', data);

        if (data.weekly_menu && Object.keys(data.weekly_menu).length > 0) {
            await UserService.updateWeeklyShoppingList(userId);
        }

        return { id: updatedDoc.id, ...data };
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


    static async addTagsList(userId, tagNames) {
        const docRef = userCollection.doc(userId);
        const doc = await docRef.get();
        if (!doc.exists) throw new Error("User not found");

        const user = doc.data();
        const ai = user.ai_profile || { tags: [], cooking_skill_level: 0 };
        ai.tags = ai.tags || [];

        for (const name of tagNames) {
            const tagName = name.toLowerCase().trim();

            // Tìm tất cả tag trùng
            let tag = ai.tags.find(t => t.tag_name === tagName);

            if (tag) {
                tag.score += 1; // nếu tồn tại → tăng 1
            } else {
                // Nếu chưa có → thêm mới
                ai.tags.push({ tag_name: tagName, score: 1 });
            }
        }

        // Loại bỏ trùng dư (merge tất cả tag trùng cùng tên)
        const uniqueTagsMap = {};
        for (const t of ai.tags) {
            if (uniqueTagsMap[t.tag_name]) {
                uniqueTagsMap[t.tag_name].score += t.score; // cộng score nếu trùng
            } else {
                uniqueTagsMap[t.tag_name] = { ...t }; // copy object
            }
        }

        // Chuyển lại thành array
        ai.tags = Object.values(uniqueTagsMap);

        // Update Firestore
        await docRef.update({
            'ai_profile.tags': ai.tags,
            updated_at: new Date()
        });

        return { success: true, tags: ai.tags };
    }



    static async getTopTags(userId, limit = 3) {
        const docRef = userCollection.doc(userId);
        const doc = await docRef.get();
        if (!doc.exists) throw new Error("User not found");

        const user = doc.data();
        const ai = user.ai_profile || { tags: [] };
        const tags = ai.tags || [];

        // Sắp xếp giảm dần theo score
        const sortedTags = tags.sort((a, b) => b.score - a.score);

        // Lấy top N (mặc định 3)
        const topTags = sortedTags.slice(0, limit);

        return topTags;
    }

    static async getTopTagNames(userId, limit = 3) {
        const docRef = userCollection.doc(userId);
        const doc = await docRef.get();
        if (!doc.exists) throw new Error("User not found");

        const user = doc.data();
        const ai = user.ai_profile || { tags: [] };
        const tags = ai.tags || [];

        // Sắp xếp giảm dần theo score
        const sortedTags = tags.sort((a, b) => b.score - a.score);

        // Lấy top N và chỉ return tag_name
        const topTagNames = sortedTags.slice(0, limit).map(t => t.tag_name);

        return topTagNames;
    }

    static async subtractTagsList(userId, tagNames) {
        const docRef = userCollection.doc(userId);
        const doc = await docRef.get();
        if (!doc.exists) throw new Error("User not found");

        const user = doc.data();
        const ai = user.ai_profile || { tags: [], cooking_skill_level: 0 };
        ai.tags = ai.tags || [];

        for (const name of tagNames) {
            const tagName = name.toLowerCase().trim();
            let tag = ai.tags.find(t => t.tag_name === tagName);

            if (tag) {
                tag.score -= 1; // trừ 1
            } else {
                // Nếu chưa có tag → tạo với điểm âm
                ai.tags.push({ tag_name: tagName, score: -1 });
            }
        }

        // Lưu lại
        await this.updateAIProfile(userId, { tags: ai.tags });

        return { success: true, tags: ai.tags };
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

        for (const key in ai_profile) {
            updateData[`ai_profile.${key}`] = ai_profile[key];
        }

        updateData[`ai_profile.cooking_skill_level`] = ai_profile.cooking_skill_level;


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

    // Chuẩn hóa dấu & hoặc +
    lower = lower.replace(/&|\+/g, ' ');

    // Các cụm không phải tên gia vị
    const ignorePhrases = [
        'to taste',
        'for driping',
        'for dipping',
        'for garnish',
        'as needed',
        "a pinch",
        "a dash"

    ];

    ignorePhrases.forEach(phrase => {
        const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
        lower = lower.replace(regex, '');
    });

    lower = lower.trim();

    // Xử lý salt & pepper
    if (lower.includes('salt') && lower.includes('pepper')) return ['salt', 'black pepper'];
    if (lower.includes('salt')) return ['salt'];

    // Tách các từ và loại bỏ đơn vị/ số
    const parts = lower.split(' ');
    const nameParts = parts.filter(p => isNaN(parseFloat(p)) && !['tbsp', 'tsp', 'cup', 'ml', 'g', 'unit'].includes(p));

    return nameParts.length > 0 ? [nameParts.join(' ').trim()] : [];
}


module.exports = UserService;
