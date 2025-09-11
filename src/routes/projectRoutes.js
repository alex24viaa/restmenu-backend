// src/routes/projectRoutes.js

const { Router } = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const projectController = require('../controllers/projectController');
const { getTasks, createTask } = require('../controllers/taskController');

const router = Router();

// Маршруты для проектов
router.get('/', authMiddleware, projectController.getProjects);
router.post('/', authMiddleware, projectController.createProject);
router.get('/:projectId', authMiddleware, projectController.getProjectById);
router.patch('/:projectId', authMiddleware, projectController.updateProject);
router.delete('/:projectId', authMiddleware, projectController.deleteProject);
router.post('/:projectId/invite', authMiddleware, projectController.inviteMember);

// ✅ НОВЫЙ МАРШРУТ ДЛЯ ПОЛУЧЕНИЯ УЧАСТНИКОВ
router.get('/:projectId/members', authMiddleware, projectController.getProjectMembers);

// Маршруты для задач внутри проекта
router.get('/:projectId/tasks', authMiddleware, getTasks);
router.post('/:projectId/tasks', authMiddleware, createTask);

module.exports = router;