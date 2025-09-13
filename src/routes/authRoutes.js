const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Маршрут для регистрации -> перенаправляем на authController.register
router.post('/register', authController.register);

// Маршрут для входа -> перенаправляем на authController.login
router.post('/login', authController.login);

// Маршрут для установки пароля -> перенаправляем на authController.setPassword
router.post('/set-password', authMiddleware, authController.setPassword);

// САМАЯ ВАЖНАЯ СТРОКА! Секретарь говорит "я готов к работе".
module.exports = router;