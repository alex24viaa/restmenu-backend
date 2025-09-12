// controllers/authController.js

const User = require('../models/User'); // Убедитесь, что путь к вашей модели User правильный
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// --- РЕГИСТРАЦИЯ ---
exports.register = async (req, res) => {
  try {
    const { login, password } = req.body;

    // Проверяем, что все поля переданы
    if (!login || !password) {
      return res.status(400).json({ message: 'Пожалуйста, укажите логин и пароль' });
    }

    // Проверка на уникальность имени
    const existingUser = await User.findOne({ login });
    if (existingUser) {
      return res.status(409).json({ message: 'Пользователь с таким логином уже существует' });
    }

    // Хэширование пароля
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Создание и сохранение нового пользователя
    const newUser = new User({
      login,
      password: hashedPassword,
    });
    await newUser.save();

    // Создаем токен для автоматического входа
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ token });

  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    res.status(500).json({ message: 'Что-то пошло не так на сервере' });
  }
};

// --- ВХОД В СИСТЕМУ ---
exports.login = async (req, res) => {
    try {
        const { login, password } = req.body;

        // Ищем пользователя по логину
        const user = await User.findOne({ login });
        if (!user) {
            return res.status(400).json({ message: 'Неверный логин или пароль' });
        }

        // Сравниваем предоставленный пароль с хэшем в базе данных
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Неверный логин или пароль' });
        }

        // Создаем и отправляем токен
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });

    } catch (error) {
        console.error('Ошибка при входе:', error);
        res.status(500).json({ message: 'Что-то пошло не так на сервере' });
    }
};

// --- УСТАНОВКА ПАРОЛЯ ---
exports.setPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.userId; // ID пользователя получаем из middleware после проверки временного токена

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Пароль должен быть не менее 6 символов' });
        }

        // Хэшируем новый пароль
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Находим пользователя и обновляем его пароль
        await User.findByIdAndUpdate(userId, { password: hashedPassword });

        // Создаем новый, уже постоянный токен
        const token = jwt.sign(
            { userId },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        res.status(200).json({ token, message: 'Пароль успешно установлен' });

    } catch (error) {
        console.error('Ошибка при установке пароля:', error);
        res.status(500).json({ message: 'Что-то пошло не так на сервере' });
    }
};