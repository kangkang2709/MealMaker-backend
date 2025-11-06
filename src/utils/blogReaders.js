const fs = require('fs/promises');
const path = require('path');

const userFilePath = path.join(__dirname, '../../blogs.json');

async function loadBlogs() {
    try {
        const data = await fs.readFile(userFilePath, 'utf8');
        const rawBlog = JSON.parse(data);
        const blogs = rawBlog.map(item => ({
            ...item,
            recipe: item.recipe || {},
            created_at: new Date(item.created_at)
        }));
        return blogs;
    } catch (err) {
        console.error("Error loading blogs:", err.message);
        return [];
    }
}

module.exports = loadBlogs;
