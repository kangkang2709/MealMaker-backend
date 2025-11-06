const fs = require('fs/promises');
const Recipe = require('../model/recipe.model');
const path = '../../recipes.json';

async function loadRecipes() {
    try {
        const data = await fs.readFile(path, 'utf8');
        const rawRecipes = JSON.parse(data);
        const recipes = rawRecipes.map(item => ({ ...item }));
        return recipes;

    } catch (err) {
        console.error('Lỗi:', err);
        return [];
    }
}

module.exports = loadRecipes;
