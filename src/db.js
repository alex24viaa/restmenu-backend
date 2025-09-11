const mongoose = require('mongoose');

// Наша последняя рабочая (длинная) строка подключения
const DB_URI = 'mongodb://alekseiignatevtrip_db_user:41Xug90FPGz9V1Vl@ac-ctzjxgh-shard-00-00.acs2bl5.mongodb.net:27017,ac-ctzjxgh-shard-00-01.acs2bl5.mongodb.net:27017,ac-ctzjxgh-shard-00-02.acs2bl5.mongodb.net:27017/?ssl=true&authSource=admin&retryWrites=true&w=majority';

// Эта настройка рекомендуется для новых версий Mongoose для предотвращения ошибок
mongoose.set('strictQuery', false);

// Функция для подключения к базе данных
const connectDB = async () => {
  try {
    await mongoose.connect(DB_URI);
    console.log('Успешно подключено к MongoDB! ✅');
  } catch (error) {
    console.error('Ошибка подключения к MongoDB:', error.message);
    // Выход из процесса с ошибкой, если не удалось подключиться
    process.exit(1);
  }
};

// Экспортируем функцию, чтобы её можно было использовать в других файлах
module.exports = connectDB;