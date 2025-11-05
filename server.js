require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./src/routes/user.routes');
const uploadRoutes = require('./src/routes/upload.routes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// ===== Middleware cơ bản =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Routes =====
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// ===== Global Error Handler (luôn cuối cùng) =====
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
