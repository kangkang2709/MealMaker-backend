require('dotenv').config();
require('module-alias/register');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const userRoutes = require('./src/routes/user.routes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
