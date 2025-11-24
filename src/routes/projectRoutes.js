const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');
const isAdminMiddleware = require('../middleware/isAdminMiddleware'); // <-- ДОБАВИЛИ ИМПОРТ

// Получить все проекты пользователя (доступно всем)
router.get('/', authMiddleware, projectController.getProjects);

// Создать новый проект (доступно всем)
router.post('/', authMiddleware, projectController.createProject);

// --- ЗАЩИЩЕННЫЕ МАРШРУТЫ ---

// Удалить проект (теперь доступно только админам)
router.delete('/:projectId', authMiddleware, isAdminMiddleware, projectController.deleteProject);

// Обновить настройки проекта (тоже защитим на всякий случай)
router.patch('/:projectId', authMiddleware, isAdminMiddleware, projectController.updateProject);

// Получить всех участников проекта (пока доступно всем участникам)
router.get('/:projectId/members', authMiddleware, projectController.getProjectMembers);

// --- МАРШРУТЫ ДЛЯ ЗАДАЧ ---
// Создать задачу в проекте
router.post('/:projectId/tasks', authMiddleware, taskController.createTask);

// Получить все задачи проекта
router.get('/:projectId/tasks', authMiddleware, taskController.getTasks);

// Пригласить участника в проект
router.post('/:projectId/invite', authMiddleware, isAdminMiddleware, projectController.inviteMember);

// В следующих шагах мы добавим сюда маршруты для управления участниками
// router.delete('/:projectId/members/:memberId', authMiddleware, isAdminMiddleware, ...);
// router.patch('/:projectId/members/:memberId/role', authMiddleware, isAdminMiddleware, ...);

// Удалить участника из проекта (только для админов)
router.delete('/:projectId/members/:memberId', authMiddleware, isAdminMiddleware, projectController.removeMember);

// Изменить роль участника (только для админов)
router.patch('/:projectId/members/:memberId/role', authMiddleware, isAdminMiddleware, projectController.changeMemberRole);

module.exports = router;