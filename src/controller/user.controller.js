const UserService = require('../services/user.service');

class UserController {
    static async getUsers(req, res) {
        try {
            const users = await UserService.getAllUsers();
            res.status(200).json(users);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    }

    static async createUser(req, res) {
        try {
            const user = await UserService.createUser(req.body);
            res.status(201).json(user);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to create user' });
        }
    }
}

module.exports = UserController;
