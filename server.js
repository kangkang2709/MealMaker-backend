require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');




// ===== Routes =====
const userRoutes = require('./src/routes/user.routes');
const recipeRoutes = require('./src/routes/recipe.routes');
const blogRoutes = require('./src/routes/blog.routes');
const ingredientRoutes = require('./src/routes/ingredient.routes');
const uploadRoutes = require('./src/routes/upload.routes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// ===== Middleware cơ bản =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Serve folder tmp/ nếu cần truy cập file tạm upload
app.use('/tmp', express.static(path.join(__dirname, 'tmp')));

// ===== API Routes =====
app.use('/api/users', userRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/upload', uploadRoutes);

// ===== Global Error Handler (luôn cuối cùng) =====
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
