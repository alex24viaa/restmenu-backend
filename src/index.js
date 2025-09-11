// src/index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const app = express();

// Подключение к базе данных
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ extended: true }));

// --- СБОРКА МАРШРУТОВ ---
// Все маршруты, связанные с аутентификацией, будут начинаться с /api/auth
app.use('/api/auth', require('./routes/authRoutes'));

// Все маршруты, связанные с проектами (и задачами ВНУТРИ проектов), будут начинаться с /api/projects
app.use('/api/projects', require('./routes/projectRoutes'));

// Все маршруты для работы с КОНКРЕТНОЙ задачей по её ID будут начинаться с /api/tasks
app.use('/api/tasks', require('./routes/taskRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));