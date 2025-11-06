const UserService = require('../services/user.service');
const ApiResponse = require('../utils/response');
const usersReader = require('../utils/userReaders');

class UserController {

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
            const user = await UserService.createUser(req.body, req.file);
            return ApiResponse.success(res, 'User created successfully', user, 201);
        } catch (err) {
            next(err);
        }
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
