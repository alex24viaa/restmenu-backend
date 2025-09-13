const Project = require('../models/Project');
const User = require('../models/User');

// --- УПРАВЛЕНИЕ ПРОЕКТАМИ ---

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user.userId })
      .populate('members.user', 'login')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (e) {
    console.error('Ошибка при получении проектов:', e);
    res.status(500).json({ message: 'Ошибка на сервере' });
  }
};

exports.createProject = async (req, res) => {
  try {
    console.log('--- Получен запрос на создание проекта ---');
    const { name } = req.body;
    const ownerId = req.user.userId;

    if (!name) {
      return res.status(400).json({ message: 'Название проекта не может быть пустым' });
    }

    const newProject = new Project({
      name,
      owner: ownerId,
      members: [{ user: ownerId, role: 'admin' }]
    });

    console.log('Попытка сохранить проект...');
    await newProject.save(); // Исправлена ошибка: была переменная project
    console.log('✅ Проект успешно сохранен!');

    res.status(201).json(newProject);
  } catch (error) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА при создании проекта:', error);
    res.status(500).json({ message: 'Что-то пошло не так на сервере' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { name, columns, statuses } = req.body;
    const project = await Project.findById(req.params.projectId);
    
    // Проверка прав уже сделана в isAdminMiddleware
    project.name = name || project.name;
    project.columns = columns || project.columns;
    project.statuses = statuses || project.statuses;
    
    await project.save();
    res.json(project);
  } catch (e) {
    res.status(500).json({ message: 'Ошибка сервера при обновлении проекта' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    // Проверка прав уже сделана в isAdminMiddleware
    await Project.findByIdAndDelete(req.params.projectId);
    res.json({ message: 'Проект удален' });
  } catch (e) {
    res.status(500).json({ message: 'Ошибка сервера при удалении проекта' });
  }
};


// --- УПРАВЛЕНИЕ УЧАСТНИКАМИ ---

exports.getProjectMembers = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId)
            .populate('members.user', 'login'); 
        
        if (!project) {
            return res.status(404).json({ message: 'Проект не найден' });
        }
        res.json(project.members);
    } catch (e) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.inviteMember = async (req, res) => {
  try {
    const { login } = req.body;
    const project = await Project.findById(req.params.projectId);
    const userToInvite = await User.findOne({ login });

    if (!userToInvite) {
      return res.status(404).json({ message: 'Пользователь с таким логином не найден' });
    }
    
    const isAlreadyMember = project.members.some(m => m.user.equals(userToInvite._id));
    if (isAlreadyMember) {
      return res.status(400).json({ message: 'Пользователь уже является участником проекта' });
    }

    // Добавляем нового участника с ролью 'member' по умолчанию
    project.members.push({ user: userToInvite._id, role: 'member' });
    await project.save();

    const updatedProject = await Project.findById(project._id).populate('members.user', 'login');
    res.json(updatedProject);

  } catch (e) {
    res.status(500).json({ message: 'Ошибка сервера при приглашении' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    const project = await Project.findById(projectId);

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
    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Некорректная роль' });
    }
    
    const project = await Project.findById(projectId);
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