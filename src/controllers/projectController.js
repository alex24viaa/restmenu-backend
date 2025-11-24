const Project = require('../models/Project');
const User = require('../models/User');

// --- УПРАВЛЕНИЕ ПРОЕКТАМИ ---

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user.userId })
      .populate('members.user', 'login')
      .populate('owner', 'login')
      .sort({ createdAt: -1 });
    
    // Убеждаемся, что owner всегда в списке участников каждого проекта
    const projectsWithOwner = projects.map(project => {
      const ownerId = project.owner._id ? project.owner._id.toString() : project.owner.toString();
      const ownerInMembers = project.members.some(m => {
        const memberId = m.user._id ? m.user._id.toString() : m.user.toString();
        return memberId === ownerId;
      });
      
      if (!ownerInMembers && project.owner) {
        // Добавляем owner в начало списка участников как admin
        project.members.unshift({
          user: project.owner,
          role: 'admin',
          _id: project.owner._id
        });
      }
      
      return project;
    });
    
    res.json(projectsWithOwner);
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

    // Возвращаем проект с populated данными
    const populatedProject = await Project.findById(newProject._id)
      .populate('members.user', 'login')
      .populate('owner', 'login');
    
    res.status(201).json(populatedProject);
  } catch (error) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА при создании проекта:', error);
    res.status(500).json({ message: 'Что-то пошло не так на сервере' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { name, columns, statuses } = req.body;
    const project = await Project.findById(req.params.projectId)
      .populate('owner', 'login');
    
    // Проверка прав уже сделана в isAdminMiddleware
    project.name = name || project.name;
    project.columns = columns || project.columns;
    project.statuses = statuses || project.statuses;
    
    // Убеждаемся, что owner всегда в списке участников
    const ownerId = project.owner._id ? project.owner._id.toString() : project.owner.toString();
    const ownerInMembers = project.members.some(m => {
      const memberId = m.user.toString ? m.user.toString() : m.user.toString();
      return memberId === ownerId;
    });
    
    if (!ownerInMembers && project.owner) {
      project.members.unshift({
        user: project.owner._id || project.owner,
        role: 'admin'
      });
    }
    
    await project.save();
    const populatedProject = await Project.findById(project._id)
      .populate('members.user', 'login')
      .populate('owner', 'login');
    res.json(populatedProject);
  } catch (e) {
    console.error('Ошибка при обновлении проекта:', e);
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
            .populate('members.user', 'login')
            .populate('owner', 'login'); 
        
        if (!project) {
            return res.status(404).json({ message: 'Проект не найден' });
        }
        
        // Убеждаемся, что owner всегда в списке участников
        const ownerId = project.owner._id ? project.owner._id.toString() : project.owner.toString();
        const ownerInMembers = project.members.some(m => {
            const memberId = m.user._id ? m.user._id.toString() : m.user.toString();
            return memberId === ownerId;
        });
        
        let members = [...project.members];
        
        // Если owner не в списке участников, добавляем его как admin
        if (!ownerInMembers && project.owner) {
            members.unshift({
                user: project.owner,
                role: 'admin',
                _id: project.owner._id
            });
        }
        
        res.json(members);
    } catch (e) {
        console.error('Ошибка при получении участников:', e);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.inviteMember = async (req, res) => {
  try {
    const { login } = req.body;
    const project = await Project.findById(req.params.projectId).populate('owner', 'login');
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

    const updatedProject = await Project.findById(project._id)
      .populate('members.user', 'login')
      .populate('owner', 'login');
    
    // Убеждаемся, что owner всегда в списке
    const ownerId = updatedProject.owner._id ? updatedProject.owner._id.toString() : updatedProject.owner.toString();
    const ownerInMembers = updatedProject.members.some(m => {
      const mId = m.user._id ? m.user._id.toString() : m.user.toString();
      return mId === ownerId;
    });
    
    if (!ownerInMembers) {
      updatedProject.members.unshift({
        user: updatedProject.owner,
        role: 'admin',
        _id: updatedProject.owner._id
      });
    }
    
    res.json(updatedProject);

  } catch (e) {
    console.error('Ошибка при приглашении участника:', e);
    res.status(500).json({ message: 'Ошибка сервера при приглашении' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    const project = await Project.findById(projectId).populate('owner', 'login');

    // Нельзя удалить создателя проекта
    const ownerId = project.owner._id ? project.owner._id.toString() : project.owner.toString();
    if (memberId === ownerId) {
      return res.status(400).json({ message: 'Нельзя удалить создателя проекта' });
    }

    const admins = project.members.filter(m => m.role === 'admin');
    const memberToRemove = project.members.find(m => m.user.toString() === memberId);

    if (admins.length === 1 && memberToRemove && memberToRemove.role === 'admin' && admins[0].user.toString() === memberId) {
      return res.status(400).json({ message: 'Нельзя удалить последнего администратора проекта' });
    }

    project.members = project.members.filter(m => m.user.toString() !== memberId);
    await project.save();

    const updatedProject = await Project.findById(projectId)
      .populate('members.user', 'login')
      .populate('owner', 'login');
    
    // Убеждаемся, что owner всегда в списке
    const updatedOwnerId = updatedProject.owner._id ? updatedProject.owner._id.toString() : updatedProject.owner.toString();
    const ownerInMembers = updatedProject.members.some(m => {
      const mId = m.user._id ? m.user._id.toString() : m.user.toString();
      return mId === updatedOwnerId;
    });
    
    if (!ownerInMembers) {
      updatedProject.members.unshift({
        user: updatedProject.owner,
        role: 'admin',
        _id: updatedProject.owner._id
      });
    }
    
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
    
    const project = await Project.findById(projectId).populate('owner', 'login');
    
    // Нельзя изменить роль создателя проекта - он всегда должен быть admin
    const ownerId = project.owner._id ? project.owner._id.toString() : project.owner.toString();
    if (memberId === ownerId) {
      return res.status(400).json({ message: 'Нельзя изменить роль создателя проекта' });
    }
    
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
    
    const updatedProject = await Project.findById(projectId)
      .populate('members.user', 'login')
      .populate('owner', 'login');
    
    // Убеждаемся, что owner всегда в списке с ролью admin
    const updatedOwnerId = updatedProject.owner._id ? updatedProject.owner._id.toString() : updatedProject.owner.toString();
    const ownerMember = updatedProject.members.find(m => {
      const mId = m.user._id ? m.user._id.toString() : m.user.toString();
      return mId === updatedOwnerId;
    });
    
    if (!ownerMember) {
      updatedProject.members.unshift({
        user: updatedProject.owner,
        role: 'admin',
        _id: updatedProject.owner._id
      });
    } else if (ownerMember.role !== 'admin') {
      ownerMember.role = 'admin';
    }
    
    res.json(updatedProject);
  } catch (error) {
    console.error('Ошибка при изменении роли:', error);
    res.status(500).json({ message: 'Ошибка на сервере' });
  }
};