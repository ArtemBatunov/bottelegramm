# One Face

Анонимная онлайн-платформа для общения между учениками одной школы с автоматическим подбором собеседников.

## Технологический стек

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, React Router, Axios, Socket.io-client
- **Backend:** Node.js, Express.js, TypeScript, Socket.io, JWT, bcrypt
- **Database:** PostgreSQL
- **ORM:** Prisma

## Требования

- Node.js 18+
- PostgreSQL 14+
- npm или yarn

## Установка и запуск

### 1. Клонирование и настройка

```bash
cd Unface
```

### 2. Backend

```bash
cd backend
npm install
```

Создайте файл `.env` (скопируйте из `.env.example`):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/oneface?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
ADMIN_EMAIL=admin@oneface.ru
```

**Важно:** Замените `user` и `password` на ваши учётные данные PostgreSQL. Убедитесь, что PostgreSQL запущен и база данных `oneface` создана (или будет создана при миграции).

### 3. База данных

```bash
# Создание миграций
npm run prisma:migrate

# Генерация Prisma Client
npm run prisma:generate

# Заполнение демо-данными (школы и пользователи)
npm run db:seed
```

### 4. Запуск Backend

```bash
npm run dev
```

Сервер будет доступен на `http://localhost:3001`.

### 5. Frontend

В новом терминале:

```bash
cd frontend
npm install
```

Создайте `.env` (опционально):

```env
VITE_API_URL=http://localhost:3001
```

По умолчанию используется `http://localhost:3001`.

### 6. Запуск Frontend

```bash
npm run dev
```

Приложение откроется на `http://localhost:5173`.

## Демо-аккаунты

После выполнения `npm run db:seed`:

| Email | Пароль |
|-------|--------|
| student1@school.ru | password123 |
| student2@school.ru | password123 |
| admin@oneface.ru | password123 |

**Admin:** Войдите как `admin@oneface.ru` и перейдите на `/admin` для доступа к панели администратора.

## Структура проекта

```
Unface/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── socket/
│   │   └── index.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── context/
│   │   └── api/
│   └── package.json
└── README.md
```

## API Endpoints

### Auth
- `POST /api/auth/register` — Регистрация
- `POST /api/auth/login` — Вход
- `POST /api/auth/logout` — Выход
- `GET /api/auth/me` — Текущий пользователь (требует JWT)

### User
- `GET /api/user/profile` — Профиль
- `PUT /api/user/profile` — Обновление профиля

### Matchmaking
- `POST /api/matchmaking/find-chat` — Найти чат
- `POST /api/matchmaking/next-chat` — Следующий чат
- `POST /api/matchmaking/stop-search` — Остановить поиск

### Chat
- `GET /api/chat/current` — Текущий чат
- `GET /api/chat/history` — История чатов
- `POST /api/chat/report` — Пожаловаться

### Admin
- `GET /api/admin/users` — Список пользователей
- `GET /api/admin/chats` — Список чатов
- `GET /api/admin/reports` — Список жалоб
- `POST /api/admin/ban-user` — Заблокировать пользователя

## Socket.io Events

- `join_chat` — Присоединиться к чату
- `send_message` — Отправить сообщение
- `receive_message` — Получить сообщение
- `next_chat` — Запросить следующий чат
- `disconnect_chat` — Чат завершён

## Безопасность

- Helmet middleware
- CORS
- Rate limiting для auth
- Санитизация вводов (validator)
- JWT аутентификация

## Лицензия

Школьный проект.
