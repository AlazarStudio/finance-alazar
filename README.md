# Payment Management Backend

Backend сервер для системы управления финансами.

## Установка

```bash
cd server
npm install
```

## Запуск

```bash
npm start
```

Для разработки с автоперезагрузкой:

```bash
npm run dev
```

Сервер запустится на `http://localhost:3000`

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

## Хранение данных

Данные хранятся в файле `server/data/data.json`

