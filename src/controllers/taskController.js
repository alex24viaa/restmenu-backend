// controllers/taskController.js
const Task = require('../models/Task');
const User = require('../models/User');
const Project = require('../models/Project'); // Добавим Project для проверок

const createLogEntry = (user, action, field, oldValue, newValue) => {
    if (String(oldValue) == String(newValue)) return null;
    return { user, action, field, oldValue: String(oldValue), newValue: String(newValue) };
};

exports.createTask = async (req, res) => {
    try {
        const { title, description, assignee, status, priority } = req.body;
        const { projectId } = req.params;

        const taskData = {
            title, description, project: projectId, status, priority,
            assignee: assignee || undefined,
            checklist: [],
            activityLog: [{ user: req.user.userId, action: 'created', field: 'задачу', newValue: title }]
        };

        const task = new Task(taskData);
        await task.save();
        const populatedTask = await Task.findById(task._id).populate('assignee', 'login').populate('activityLog.user', 'login');
        res.status(201).json(populatedTask);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Ошибка на сервере при создании задачи' });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const updates = req.body;
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Задача не найдена' });

        const newLogEntries = [];
        const log = (field, oldValue, newValue) => {
            const entry = createLogEntry(req.user.userId, 'updated', field, oldValue, newValue);
            if (entry) newLogEntries.push(entry);
        };

        log('название', task.title, updates.title);
        log('описание', task.description, updates.description);
        log('статус', task.status, updates.status);
        log('приоритет', task.priority, updates.priority);

        if (String(task.assignee) !== String(updates.assignee)) {
            const oldUser = await User.findById(task.assignee);
            const newUser = await User.findById(updates.assignee);
            log('исполнителя', oldUser ? oldUser.login : 'Никто', newUser ? newUser.login : 'Никто');
        }

        if (JSON.stringify(task.checklist) !== JSON.stringify(updates.checklist)) {
            newLogEntries.push({ user: req.user.userId, action: 'updated', field: 'чек-лист' });
        }
        
        task.set(updates);
        if (newLogEntries.length > 0) {
            task.activityLog.unshift(...newLogEntries);
        }
        await task.save();
        const populatedTask = await Task.findById(task._id).populate('assignee', 'login').populate('activityLog.user', 'login');
        res.json(populatedTask);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка на сервере при обновлении задачи' });
    }
};

exports.getTasks = async (req, res) => {
    try {
        const { projectId } = req.params;
        const tasks = await Task.find({ project: projectId }).populate('assignee', 'login').populate('activityLog.user', 'login').sort({ createdAt: -1 });
        res.json(tasks);
    } catch (e) {
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
};

// ✅ ВОТ ВОЗВРАЩЕННАЯ ФУНКЦИЯ
exports.getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId).populate('assignee', 'login').populate('activityLog.user', 'login').populate('project');
        if (!task) {
            return res.status(404).json({ message: 'Задача не найдена' });
        }
        if (!task.project.members.includes(req.user.userId)) {
             return res.status(403).json({ message: 'Доступ запрещен' });
        }
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await Task.findByIdAndDelete(taskId);
        if (!task) return res.status(404).json({ message: 'Задача не найдена' });
        res.json({ message: 'Задача успешно удалена', taskId });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
};