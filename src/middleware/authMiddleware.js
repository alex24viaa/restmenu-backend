// Полное содержимое для НОВОГО файла: src/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

console.log("--- Файл authMiddleware.js ЗАГРУЖЕН ---"); // Тестовая строка

module.exports = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next();
    }
    try {
        const token = req.headers.authorization.split(' ')[1]; 
        if (!token) {
            return res.status(401).json({ message: 'Нет авторизации' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ message: 'Нет авторизации' });
    }
};