# FileShare — Архитектура проекта

## Обзор

FileShare — клиент-серверное приложение для анонимного обмена файлами и текстом.

## Компоненты

### 1. Frontend (React + Vite + Tailwind)

**Технологии:**
- React 18
- TypeScript
- Vite (сборщик)
- Tailwind CSS v4
- Zustand (state management)
- React Router (навигация)
- Lucide React (иконки)

**Структура:**
```
frontend/
├── src/
│   ├── components/     # Переиспользуемые компоненты
│   │   ├── Header.tsx
│   │   └── Layout.tsx
│   ├── pages/          # Страницы приложения
│   │   ├── HomePage.tsx        # Загрузка файлов
│   │   ├── HistoryPage.tsx     # История сессии
│   │   ├── TextSharePage.tsx   # Обмен текстом
│   │   ├── AdminSetupPage.tsx  # Первый вход в админку
│   │   └── AdminPage.tsx       # Панель администратора
│   ├── store/          # Zustand store
│   │   └── useAppStore.ts
│   ├── App.tsx         # Роутинг
│   └── main.tsx        # Точка входа
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.js
```

**Принципы:**
- Компоненты не хранят данные локально — всё через API
- Сессия отслеживается через cookie (HttpOnly)
- Настройки загружаются из БД через админку

### 2. Backend (Node.js + Express)

**Технологии:**
- Node.js 24 LTS
- Express.js
- TypeScript
- PostgreSQL (pg)
- Multer (загрузка файлов)
- JWT (авторизация)
- Winston (логирование)
- node-cron (очистка данных)

**Архитектура (SOLID):**
```
backend/src/
├── config/         # Конфигурация (S: Single Responsibility)
│   ├── index.ts
│   └── database.ts
├── controllers/    # Контроллеры (S: обработка HTTP)
│   ├── FileController.ts
│   ├── TextController.ts
│   └── AdminController.ts
├── middleware/     # Middleware (O: Open/Closed)
│   ├── session.ts
│   ├── auth.ts
│   └── errorHandler.ts
├── routes/         # Маршруты (I: Interface Segregation)
│   ├── files.ts
│   ├── texts.ts
│   └── admin.ts
├── services/       # Бизнес-логика (D: Dependency Inversion)
│   ├── SessionService.ts
│   ├── FileService.ts
│   ├── TextService.ts
│   ├── SettingsService.ts
│   └── AdminService.ts
├── utils/          # Утилиты
│   └── logger.ts
├── database/       # Миграции
│   ├── init.sql
│   └── migrate.ts
└── app.ts          # Точка входа
```

**Поток данных:**
```
HTTP Request
    → Middleware (CORS, Helmet, Rate Limit)
    → Route
    → Session Middleware (создаёт/продлевает сессию)
    → Controller (валидация, вызов сервиса)
    → Service (бизнес-логика, запросы к БД)
    → Database (PostgreSQL)
    → Response
```

### 3. Database (PostgreSQL)

**Таблицы:**
- `sessions` — сессии пользователей
- `files` — загруженные файлы (метаданные)
- `shared_texts` — общие тексты
- `admins` — администраторы
- `settings` — настройки сервиса
- `audit_logs` — логи действий

**Связи:**
```
sessions (1) ──── (N) files
sessions (1) ──── (N) shared_texts
admins (standalone)
settings (standalone)
```

**Индексы:**
- `sessions.expires_at` — для очистки просроченных
- `files.session_id` — для поиска файлов сессии
- `files.expires_at` — для очистки
- `shared_texts.session_id` — для поиска текстов сессии

### 4. Nginx (Reverse Proxy)

**Функции:**
- SSL/TLS termination
- Reverse proxy для API и Frontend
- Gzip сжатие
- Security headers
- Rate limiting (дополнительно)
- Static file caching

**Конфигурация:**
- `nginx.conf` — основная конфигурация
- `conf.d/default.conf` — виртуальный хост
- `ssl.conf.template` — шаблон для SSL

## Поток данных

### Загрузка файла:
```
1. Frontend: Пользователь выбирает файл
2. Frontend → Backend: POST /api/files/upload (multipart)
3. Backend: Multer принимает файл в память
4. Backend: FileService сохраняет на диск + в БД
5. Backend → Frontend: { id, downloadLink, expiresAt }
6. Frontend: Показывает ссылку для скачивания
```

### Скачивание файла:
```
1. Пользователь переходит по ссылке /api/files/:id/download
2. Backend: Находит файл в БД
3. Backend: Увеличивает счётчик скачиваний
4. Backend: Отправляет файл (res.download)
```

### Сессия:
```
1. Первый визит → Backend создаёт сессию, устанавливает cookie
2. Каждый визит → Cookie продлевает срок жизни сессии
3. 7 дней без активности → Сессия и данные удаляются (cron)
```

## Безопасность

| Уровень | Мера |
|---------|------|
| Транспорт | HTTPS (TLS 1.2/1.3) |
| HTTP | Helmet (X-Frame, CSP, etc.) |
| Rate Limit | 100 req / 15 min |
| Сессия | HttpOnly, Secure, SameSite cookies |
| Админка | JWT + bcrypt (12 rounds) |
| Файлы | Случайные UUID имена, проверка размера |
| Пароль | Мин. 12 симв., буквы, цифры, спецсимволы |

## Масштабирование

**Горизонтальное:**
- Backend: несколько инстансов за load balancer
- DB: репликация (read replicas)
- Storage: S3/MinIO вместо локального диска

**Вертикальное:**
- Увеличение ресурсов контейнеров
- Настройка connection pool PostgreSQL
