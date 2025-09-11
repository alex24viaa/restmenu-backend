// controllers/projectController.js

const Project = require('../models/Project');
const User = require('../models/User');

// Получить все проекты пользователя
exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find({ members: req.user.userId });
        res.json(projects);
    } catch (e) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

// Создать новый проект
exports.createProject = async (req, res) => {
    try {
        const { name } = req.body;
        const project = new Project({
            name,
            owner: req.user.userId,
            members: [req.user.userId]
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