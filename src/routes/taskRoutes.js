// routes/taskRoutes.js
const { Router } = require('express');
const authMiddleware = require('../middleware/authMiddleware');
// Импортируем только те функции, которые нужны для работы с ОДНОЙ задачей
const { getTaskById, updateTask, deleteTask } = require('../controllers/taskController');
const router = Router();

// Эти маршруты будут использоваться с префиксом /api/tasks

// Получить задачу по ID
router.get('/:taskId', authMiddleware, getTaskById);

// Обновить задачу по ID
router.patch('/:taskId', authMiddleware, updateTask);

// Удалить задачу по ID
router.delete('/:taskId', authMiddleware, deleteTask);

module.exports = router;