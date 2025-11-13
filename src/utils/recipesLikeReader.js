const fs = require('fs/promises');
const path = require('path');
const filePath = path.join(__dirname, '../data/output.json');

async function loadRecipesLike() {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        const rawRecipesLike = JSON.parse(data);
        const recipesLike = rawRecipesLike.map(item => ({ ...item }));
        return recipesLike;

    } catch (err) {
        console.error('Lỗi:', err);
        return [];
    }
}

module.exports = loadRecipesLike;
