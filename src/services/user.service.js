const { db } = require('../config/firebase.config');
const User = require('../model/user.model');

const userCollection = db.collection('users');

class UserService {
    static async getAllUsers() {
        const snapshot = await userCollection.get();
        return snapshot.docs.map(doc => new User(doc.id, doc.data()));
    }

    static async createUser(data) {
        const newUser = {
            ...data,
            createdAt: new Date(),
        };
        const docRef = await userCollection.add(newUser);
        return { id: docRef.id, ...newUser };
    }
}

module.exports = UserService;
