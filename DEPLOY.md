# Инструкция по деплою бэкенда на продакшен

## Вариант 1: Деплой через Git (рекомендуется)

### Шаг 1: Закоммитить и отправить изменения

```bash
cd restmenu-backend
git add .
git commit -m "Добавлены маршруты для создания и получения задач"
git push origin main
```

### Шаг 2: Подключиться к серверу по SSH

```bash
ssh user@restmenu.online
# или
ssh user@your-server-ip
```

### Шаг 3: На сервере - перейти в директорию проекта и обновить код

```bash
cd /path/to/restmenu-backend  # замените на реальный путь
git pull origin main
```

### Шаг 4: Установить зависимости (если нужно)

```bash
npm install
```

### Шаг 5: Перезапустить приложение

**Если используете PM2:**
```bash
pm2 restart restmenu-backend
# или
pm2 reload restmenu-backend
```

**Если используете systemd:**
```bash
sudo systemctl restart restmenu-backend
```

**Если запускаете напрямую через node:**
```bash
# Остановить текущий процесс (Ctrl+C или kill)
# Затем запустить:
npm start
# или
node src/index.js
```

**Если используете nodemon (только для разработки):**
```bash
npm run dev
```

---

## Вариант 2: Установка PM2 (если еще не установлен)

PM2 - это менеджер процессов для Node.js, который автоматически перезапускает приложение при сбоях.

### Установка PM2:

```bash
npm install -g pm2
```

### Запуск приложения через PM2:

```bash
cd /path/to/restmenu-backend
pm2 start ecosystem.config.js
# или
pm2 start src/index.js --name restmenu-backend
```

### Полезные команды PM2:

```bash
pm2 list                    # Список всех процессов
pm2 restart restmenu-backend # Перезапуск
pm2 stop restmenu-backend    # Остановка
pm2 logs restmenu-backend    # Просмотр логов
pm2 monit                   # Мониторинг в реальном времени
pm2 save                    # Сохранить список процессов
pm2 startup                 # Автозапуск при перезагрузке сервера
```

---

## Вариант 3: Деплой через FTP/SFTP

1. Загрузите измененные файлы через FTP-клиент (FileZilla, WinSCP и т.д.)
2. Подключитесь к серверу
3. Загрузите файлы в директорию проекта
4. Перезапустите приложение (см. Шаг 5 выше)

---

## Проверка после деплоя

1. Проверьте, что сервер запущен:
   ```bash
   pm2 list
   # или
   curl http://localhost:3000/api/projects
   ```

2. Проверьте логи на наличие ошибок:
   ```bash
   pm2 logs restmenu-backend
   ```

3. Проверьте работу API:
   - Откройте https://www.restmenu.online
   - Попробуйте создать задачу
   - Проверьте консоль браузера на наличие ошибок

---

## Настройка переменных окружения

Убедитесь, что на сервере настроены переменные окружения в файле `.env`:

```env
PORT=3000
JWT_SECRET=your-secret-key-here
MONGODB_URI=your-mongodb-connection-string
```

---

## Автоматический деплой (опционально)

Можно настроить автоматический деплой через GitHub Actions или webhook:

1. Создайте `.github/workflows/deploy.yml` для GitHub Actions
2. Или настройте webhook на сервере для автоматического `git pull` и перезапуска

---

## Важные замечания

- ⚠️ **Всегда делайте бэкап базы данных перед деплоем**
- ⚠️ **Проверяйте логи после деплоя**
- ⚠️ **Убедитесь, что порт 3000 открыт в файрволе**
- ⚠️ **Используйте PM2 или systemd для production, не nodemon**

