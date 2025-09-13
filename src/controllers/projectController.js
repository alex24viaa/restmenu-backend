// controllers/projectController.js

const Project = require('../models/Project');
const User = require('../models/User');

// Получить все проекты пользователя
exports.getProjects = async (req, res) => {
  try {
    // ИЗМЕНЕНИЕ: Ищем все проекты, где ID текущего пользователя
    // есть в массиве 'members.user'.
    // Также мы "наполняем" (populate) данные участников, чтобы получить их логины.
    const projects = await Project.find({ 'members.user': req.user.userId })
      .populate('members.user', 'login')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (e) {
    console.error('Ошибка при получении проектов:', e);
    res.status(500).json({ message: 'Ошибка на сервере' });
  }
};
// Создать новый проект
exports.createProject = async (req, res) => {
    try {
        const { name } = req.body;
        const newProject = new Project({
  name: req.body.name,
  owner: req.user.userId,
  members: [{ user: req.user.userId, role: 'admin' }] 
});
        await project.save();
        res.status(201).json(project);
    } catch (e) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

// Получить проект по ID
exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project || !project.members.includes(req.user.userId)) {
            return res.status(403).json({ message: 'Доступ запрещен' });
        }
        res.json(project);
    } catch (e) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

// Обновить проект
exports.updateProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project || project.owner.toString() !== req.user.userId) {
             return res.status(403).json({ message: 'Доступ запрещен, вы не владелец' });
        }
        project.name = req.body.name || project.name;
        project.columns = req.body.columns || project.columns;
        project.statuses = req.body.statuses || project.statuses;
        
        await project.save();
        res.json(project);
    } catch (e) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

// Удалить проект
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project || project.owner.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Доступ запрещен, вы не владелец' });
        }
        await project.deleteOne();
        res.json({ message: 'Проект удален' });
    } catch (e) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

// Пригласить участника
exports.inviteMember = async (req, res) => {
    try {
        const { login } = req.body;
        const project = await Project.findById(req.params.projectId);
        const userToInvite = await User.findOne({ login });

        if (!project || project.owner.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Только владелец может приглашать участников' });
        }
        if (!userToInvite) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        if (project.members.includes(userToInvite._id)) {
            return res.status(400).json({ message: 'Пользователь уже в проекте' });
        }

        project.members.push(userToInvite._id);
        await project.save();
        res.json({ message: 'Пользователь приглашен', members: project.members });
    } catch (e) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

// ✅ НОВАЯ ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ УЧАСТНИКОВ
exports.getProjectMembers = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId)
            .populate('members', 'login'); // Находим проект и сразу получаем данные участников (только поле login)
        
        if (!project) {
            return res.status(404).json({ message: 'Проект не найден' });
        }
        
        res.json(project.members);
    } catch (e) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};
// controllers/projectController.js

// ... здесь ваши существующие функции: getProjects, createProject и т.д. ...

exports.removeMember = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    // Нельзя удалить самого себя, если ты последний админ
    const admins = project.members.filter(m => m.role === 'admin');
    const memberToRemove = project.members.find(m => m.user.toString() === memberId);

    if (admins.length === 1 && memberToRemove.role === 'admin' && admins[0].user.toString() === memberId) {
      return res.status(400).json({ message: 'Нельзя удалить последнего администратора проекта' });
    }

    project.members = project.members.filter(m => m.user.toString() !== memberId);
    await project.save();

    const updatedProject = await Project.findById(projectId).populate('members.user', 'login');
    res.json(updatedProject);

  } catch (error) {
    console.error('Ошибка при удалении участника:', error);
    res.status(500).json({ message: 'Ошибка на сервере' });
  }
};

exports.changeMemberRole = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    const { role } = req.body; // Ожидаем получить новую роль: 'admin' или 'member'

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Некорректная роль' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    // Проверка, чтобы не снять права с последнего админа
    if (role === 'member') {
        const admins = project.members.filter(m => m.role === 'admin');
        if (admins.length === 1 && admins[0].user.toString() === memberId) {
            return res.status(400).json({ message: 'Нельзя снять права с последнего администратора' });
        }
    }

    const memberIndex = project.members.findIndex(m => m.user.toString() === memberId);
    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Участник не найден в проекте' });
    }

    project.members[memberIndex].role = role;
    await project.save();

    const updatedProject = await Project.findById(projectId).populate('members.user', 'login');
    res.json(updatedProject);

  } catch (error) {
    console.error('Ошибка при изменении роли:', error);
    res.status(500).json({ message: 'Ошибка на сервере' });
  }
};