require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

// Импортируем все маршруты
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

// Подключение к базе данных
connectDB();

// Middleware для обработки JSON и CORS
app.use(cors());
app.use(express.json());

// --- Диагностика и подключение маршрутов ---
// Проверяем каждый роутер перед использованием
if (authRoutes && typeof authRoutes === 'function') {
  app.use('/api/auth', authRoutes);
  console.log('✅ Маршруты аутентификации (authRoutes) успешно подключены.');
} else {
  console.error('❌ ОШИБКА: authRoutes не является функцией! Проверьте экспорт в файле routes/authRoutes.js');
}

if (projectRoutes && typeof projectRoutes === 'function') {
  app.use('/api/projects', projectRoutes);
  console.log('✅ Маршруты проектов (projectRoutes) успешно подключены.');
} else {
  console.error('❌ ОШИБКА: projectRoutes не является функцией! Проверьте экспорт в файле routes/projectRoutes.js');
}

if (taskRoutes && typeof taskRoutes === 'function') {
  app.use('/api/tasks', taskRoutes);
  console.log('✅ Маршруты задач (taskRoutes) успешно подключены.');
} else {
  console.error('❌ ОШИБКА: taskRoutes не является функцией! Проверьте экспорт в файле routes/taskRoutes.js');
}


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
