const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware'); // Добавляем middleware

// Маршрут для регистрации (остается без изменений)
router.post('/register', authController.register);

// Маршрут для входа (остается без изменений)
router.post('/login', authController.login);

// НОВЫЙ МАРШРУТ: для установки пароля новым пользователем
// Он защищен middleware, чтобы пароль мог установить только тот, кто получил временный токен
router.post('/set-password', authMiddleware, authController.setPassword);

module.exports = router;