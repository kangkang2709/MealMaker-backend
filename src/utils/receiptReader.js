const fs = require('fs/promises');
const Recipe = require('../model/recipe.model');
const path = require('path');
const filePath = path.join(__dirname, '../data/recipes2.json');

async function loadRecipes() {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        const rawRecipes = JSON.parse(data);
        const recipes = rawRecipes.map(item => ({ ...item }));
        return recipes;

    } catch (err) {
        console.error('Lỗi:', err);
        return [];
    }
}

module.exports = loadRecipes;
