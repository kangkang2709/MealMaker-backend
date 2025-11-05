const { db } = require('../config/firebase.config');
const { uploadImage } = require('../services/upload.service'); // ✅ đúng


const userCollection = db.collection('users');

class UserService {
    // Tạo user mới
    static async createUser(userData, file) {
        if (file) {
            const { url } = await uploadImage(file.path);
            userData.avatar_url = url;
        }

        const newUser = {
            ...userData,
            created_at: new Date(),
            updated_at: new Date(),
        };

        const docRef = userCollection.doc(); // tự generate ID
        await docRef.set(newUser);
        const doc = await docRef.get();

        return { id: doc.id, ...doc.data() };
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
        const doc = await userCollection.doc(id).get();
        if (!doc.exists) throw { code: 'USER_NOT_FOUND', message: 'User not found' };
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
