const User = require('../models/User');
const bcrypt = require('bcryptjs'); // Использование bcryptjs рекомендуется, но bcrypt тоже подойдет
const jwt = require('jsonwebtoken');

// Функция регистрации (ваша рабочая версия)
exports.register = async (req, res) => {
 try {
   const { login, password } = req.body;
   if (!password || password.length < 6) {
       return res.status(400).json({ message: "Пароль должен быть не менее 6 символов" });
   }
   const candidate = await User.findOne({ login });
   if (candidate) {
     return res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
   }
   const user = new User({ login, password });
   await user.save();
   return res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
 } catch (error) {
   console.error('Ошибка при регистрации:', error.message);
   res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
 }
};


// ОБНОВЛЕННАЯ ФУНКЦИЯ ВХОДА
exports.login = async (req, res) => {
 try {
   const { login, password } = req.body;
   const user = await User.findOne({ login });
   if (!user) {
     return res.status(400).json({ message: 'Неверный логин или пароль' });
   }

   // --- НОВАЯ ЛОГИКА ---
   // Если у пользователя нет пароля (он был создан по приглашению)
   if (!user.password) {
       // Выдаем специальный временный токен для установки пароля
       const tempToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
       return res.status(401).json({
           message: 'Требуется установка пароля',
           setPasswordRequired: true,
           tempToken: tempToken
       });
   }
   // --- КОНЕЦ НОВОЙ ЛОГИКИ ---

   const isMatch = await bcrypt.compare(password, user.password);
   if (!isMatch) {
     return res.status(400).json({ message: 'Неверный логин или пароль' });
   }

   const token = jwt.sign(
     { userId: user.id },
     process.env.JWT_SECRET, // Убедитесь, что JWT_SECRET доступен
     { expiresIn: '24h' }
   );

   res.json({ token, userId: user.id });

 } catch (error) {
   console.error('Ошибка при входе:', error.message);
   res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
 }
};


// НОВАЯ ФУНКЦИЯ ДЛЯ УСТАНОВКИ ПАРОЛЯ
exports.setPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.userId; // ID получаем из authMiddleware (из временного токена)

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Пароль должен быть не менее 6 символов' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        
        user.password = password;
        await user.save(); // Хук в модели User.js автоматически захэширует пароль
        
        // Сразу же логиним пользователя, выдав ему постоянный токен
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ message: 'Пароль успешно установлен', token, userId: user.id });

    } catch(e) {
        console.error('Ошибка при установке пароля:', e.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
};