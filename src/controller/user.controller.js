// src/controller/user.controller.js
const UserService = require('../services/user.service');
const ApiResponse = require('../utils/response');
const throwError = require('../utils/throwError');

class UserController {
    static async getUsers(req, res, next) {
        try {
            const users = await UserService.getAllUsers();
            return ApiResponse.success(res, "Fetched all users successfully", users);
        } catch (err) {
            next(err); // ✅ đẩy sang global errorHandler
        }
    }

    static async createUser(req, res, next) {
        try {
            const { name, email } = req.body;
            if (!name || !email) throwError("VALIDATION_ERROR", "Missing name or email");

            const user = await UserService.createUser(req.body);
            return ApiResponse.success(res, "User created successfully", user, 201);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = UserController;
