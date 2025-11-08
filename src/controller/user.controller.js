const UserService = require('../services/user.service');
const ApiResponse = require('../utils/response');
const usersReader = require('../utils/userReaders');

class UserController {
     static async updateAIProfile(req, res, next) {
        try {
            const { ai_profile } = req.body;
            const user = await UserService.updateAIProfile(req.params.id, ai_profile);
            return ApiResponse.success(res, 'AI profile updated', user);
        } catch (err) {
            next(err);
        }
    }
    static async updateWeeklyShoppingList(req, res, next) {
        try {
            const userId = req.params.id;
            const updatedUser = await UserService.updateWeeklyShoppingList(userId);
            return ApiResponse.success(res, 'Weekly shopping list updated', updatedUser);
        } catch (err) {
            next(err);
        }
    }
    static async updateFridge(req, res, next) {
        try {
            const { fridge } = req.body;
            const user = await UserService.updateFridge(req.params.id, fridge);
            return ApiResponse.success(res, 'Fridge updated', user);
        } catch (err) {
            next(err);
        }
    }

    static async updateWeeklyMenu(req, res, next) {
        try {
            const { weekly_menu } = req.body;
            const user = await UserService.updateWeeklyMenu(req.params.id, weekly_menu);
            return ApiResponse.success(res, 'Weekly menu updated', user);
        } catch (err) {
            next(err);
        }
    }
 static async login(req, res, next) {
        try {
            const { user_name, password } = req.body;
            const user = await UserService.login(user_name, password);
            return ApiResponse.success(res, 'Login successful', user);
        } catch (err) {
            next(err);
        }
    }
    static async createAllUser(req, res, next) {
        try {
            const users = await usersReader();
            await UserService.createAllUser(users);
            return ApiResponse.success(res, 'User created successfully', null, 201);
        } catch (err) {
            next(err);
        }
    }

    static async createUser(req, res, next) {
        try {
       const file = req.file || null;
       console.log(file)
       const userData = req.body.data ? JSON.parse(req.body.data) : {};
       console.log(userData)
            const user = await UserService.createUser(userData,file);
            return ApiResponse.success(res, 'User created successfully', user, 201);
        } catch (err) {
            next(err);
        }
    }

 static async getUserById(id) {
        const docRef = userCollection.doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error('User not found');
        }

        return { id: doc.id, ...doc.data() };
    }

    static async updateUser(req, res, next) {
        try {
            const user = await UserService.updateUser(req.params.id, req.body, req.file);
            return ApiResponse.success(res, 'User updated successfully', user);
        } catch (err) {
            next(err);
        }
    }

    static async getAllUsers(req, res, next) {
        try {
            const users = await UserService.getAllUsers();
            return ApiResponse.success(res, 'Users fetched successfully', users);
        } catch (err) {
            next(err);
        }
    }

    static async getUserById(req, res, next) {
        try {
            const user = await UserService.getUserById(req.params.id);
            return ApiResponse.success(res, 'User fetched successfully', user);
        } catch (err) {
            next(err);
        }
    }

    static async deleteUser(req, res, next) {
        try {
            const result = await UserService.deleteUser(req.params.id);
            return ApiResponse.success(res, 'User deleted successfully', result);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = UserController;
