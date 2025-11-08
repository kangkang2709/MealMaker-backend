const { db } = require('../config/firebase.config');
const { uploadImage } = require('../services/upload.service'); // ✅ đúng
const User = require('../model/user.model')
const userCollection = db.collection('users');
const RecipeService = require('../services/recipe.service');
   const spices = [
  'salt',
  'sugar',
  'pepper',
  'cinnamon',
  'paprika',
  'turmeric',
  'garlic powder',
  'onion powder',
  'ginger',
  'chili powder',
  'basil',
  'oregano',
  'thyme',
  'rosemary',
  'oil',
  'butter',
  'vinegar',
  'soy sauce',
  'water'
];
class UserService {



  static async updateWeeklyShoppingList(userId) {
        // Lấy user hiện tại
        const userDoc = await userCollection.doc(userId).get();
        if (!userDoc.exists) throw new Error('User not found');

        const user = userDoc.data();
        const updatedShoppingList = {};

        // Duyệt qua từng ngày trong weekly_menu
        for (const day of Object.keys(user.weekly_menu)) {
            const recipesForDay = user.weekly_menu[day] || [];
            const shoppingListForDay = new Set(); // dùng Set để tránh trùng

            for (const recipeId of recipesForDay) {
                const recipe = await RecipeService.getRecipeById(recipeId);
                if (!recipe || !recipe.ingredients_list) continue;

                for (const ingredientLine of recipe.ingredients_list) {
                    const ingredientName = ingredientLine.split(' ')[0].toLowerCase();

                    // Bỏ qua gia vị
                    if (spices.includes(ingredientName)) continue;

                    // Nếu trong fridge đã có, bỏ qua
                    if (user.fridge[ingredientName]) continue;

                    shoppingListForDay.add(ingredientName);
                }
            }

            updatedShoppingList[day] = shoppingListForDay.size > 0
                ? Array.from(shoppingListForDay)
                : [];
        }

        // Cập nhật user document
        await userCollection.doc(userId).update({ weekly_shopping_list: updatedShoppingList });

        const updatedDoc = await userCollection.doc(userId).get();
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }


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
            await docRef.set(user);
            const doc = await docRef.get();
            createdUsers.push({ id: doc.id, ...doc.data() });
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

        updateData.updated_at = new Date();
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

module.exports = UserService;
