// utils/userReaders.js
const fs = require('fs/promises');
const path = require('path');
const userFilePath = path.join(__dirname, '../../user.json');

async function loadUsers() {
    const data = await fs.readFile(userFilePath, 'utf8');
    const rawUsers = JSON.parse(data);
    if (!Array.isArray(rawUsers)) throw new Error('user.json must contain an array');
    return rawUsers;
}

module.exports = loadUsers;
