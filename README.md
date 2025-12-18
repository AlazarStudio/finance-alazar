# Payment Management Backend

Backend сервер для системы управления финансами.

## Установка

```bash
cd server
npm install
```

## Запуск

### HTTP (для разработки)

```bash
npm start
```

Для разработки с автоперезагрузкой:

```bash
npm run dev
```

Сервер запустится на `http://localhost:3000`

### HTTPS (для продакшена)

1. Поместите SSL сертификаты в папку `server/ssl/`:
   - `private.key` - приватный ключ
   - `certificate.crt` - сертификат
   - `ca_bundle.crt` - CA bundle (опционально)

2. Запустите сервер:
```bash
npm start
```

Сервер автоматически определит наличие сертификатов и запустится через HTTPS.

Подробные инструкции по настройке SSL см. в [SSL_README.md](./SSL_README.md)

## API Endpoints

### Данные
- `GET /api/data` - Получить все данные
- `PUT /api/data` - Обновить все данные

### Клиенты
- `GET /api/clients` - Список клиентов
- `POST /api/clients` - Добавить клиента
- `PUT /api/clients/:id` - Обновить клиента
- `DELETE /api/clients/:id` - Удалить клиента

### Сотрудники
- `GET /api/employees` - Список сотрудников
- `POST /api/employees` - Добавить сотрудника
- `PUT /api/employees/:id` - Обновить сотрудника
- `DELETE /api/employees/:id` - Удалить сотрудника

### Доходы
- `GET /api/incomes` - Список доходов
- `POST /api/incomes` - Добавить доход
- `PUT /api/incomes/:id` - Обновить доход
- `DELETE /api/incomes/:id` - Удалить доход

### Постоянные расходы
- `GET /api/fixed-expenses` - Список постоянных расходов
- `POST /api/fixed-expenses` - Добавить постоянный расход
- `PUT /api/fixed-expenses/:id` - Обновить постоянный расход
- `DELETE /api/fixed-expenses/:id` - Удалить постоянный расход

### Разовые расходы
- `GET /api/variable-expenses` - Список разовых расходов
- `POST /api/variable-expenses` - Добавить разовый расход
- `PUT /api/variable-expenses/:id` - Обновить разовый расход
- `DELETE /api/variable-expenses/:id` - Удалить разовый расход

### Категории расходов
- `GET /api/expense-categories` - Список категорий
- `POST /api/expense-categories` - Добавить категорию
- `PUT /api/expense-categories/:id` - Обновить категорию
- `DELETE /api/expense-categories/:id` - Удалить категорию

### Настройки
- `GET /api/organization` - Настройки организации
- `PUT /api/organization` - Обновить настройки организации
- `GET /api/app-settings` - Настройки приложения
- `PUT /api/app-settings` - Обновить настройки приложения

### Авторизация
- `POST /api/auth/login` - Вход в систему (требует `username` и `password`)
- `POST /api/auth/verify` - Проверка токена
- `POST /api/auth/logout` - Выход из системы

**Важно**: Все API endpoints (кроме `/api/auth/*` и `/api/health`) требуют авторизации через Bearer токен в заголовке `Authorization`.

## Хранение данных

Данные хранятся в файле `server/data/data.json`

