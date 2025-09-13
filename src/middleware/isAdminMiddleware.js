// middleware/isAdminMiddleware.js
const Project = require('../models/Project');

module.exports = async function(req, res, next) {
  try {
    // ID проекта мы возьмем из параметров запроса (например, /api/projects/ВАШ_ID_ПРОЕКТА)
    const projectId = req.params.projectId || req.body.projectId;
    if (!projectId) {
      return res.status(400).json({ message: 'ID проекта не найден в запросе' });
    }

    // ID пользователя мы уже получили из предыдущего authMiddleware
    const userId = req.user.userId;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    // Ищем пользователя в массиве участников проекта
    const member = project.members.find(m => m.user.toString() === userId);

    // Проверяем, является ли он администратором
    if (member && member.role === 'admin') {
      // Если да, пропускаем его дальше к основной логике
      next();
    } else {
      // Если нет, блокируем доступ
      return res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора.' });
    }

  } catch (error) {
    console.error('Ошибка в isAdminMiddleware:', error);
    res.status(500).json({ message: 'Ошибка на сервере при проверке прав' });
  }
};