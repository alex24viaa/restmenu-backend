const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
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


// В следующих шагах мы добавим сюда маршруты для управления участниками
// router.delete('/:projectId/members/:memberId', authMiddleware, isAdminMiddleware, ...);
// router.patch('/:projectId/members/:memberId/role', authMiddleware, isAdminMiddleware, ...);

// Удалить участника из проекта (только для админов)
router.delete('/:projectId/members/:memberId', authMiddleware, isAdminMiddleware, projectController.removeMember);

// Изменить роль участника (только для админов)
router.patch('/:projectId/members/:memberId/role', authMiddleware, isAdminMiddleware, projectController.changeMemberRole);

module.exports = router;