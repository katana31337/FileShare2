# FileShare — Сервис обмена файлами и текстом

Анонимный сервис для обмена файлами и текстом. Без регистрации, с отслеживанием по сессии.

## 🏗 Архитектура

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Nginx     │────▶│  Frontend   │     │ PostgreSQL  │
│  (SSL/TLS)  │     │  (React)    │     │   (Data)    │
│  :80/:443   │     │  :80        │     │   :5432     │
└──────┬──────┘     └─────────────┘     └──────┬──────┘
       │                                        │
       │            ┌─────────────┐             │
       └───────────▶│  Backend    │─────────────┘
                    │  (Express)  │
                    │   :3001     │
                    └─────────────┘
```

## 📦 Сервисы

| Сервис | Описание | Порт |
|--------|----------|------|
| **Frontend** | React SPA (Vite + Tailwind) | 80 (через nginx) |
| **Backend** | Node.js 24 + Express API | 3001 |
| **Database** | PostgreSQL 16 | 5432 |
| **Nginx** | Reverse proxy + SSL | 80, 443 |

## 🚀 Быстрый старт

### Вариант 1: Установка из Docker Hub (рекомендуется)

```bash
# 1. Создайте .env файл
cp .env.example .env
# Отредактируйте .env (пароли, секреты, домен)

# 2. Используйте docker-compose.production.yml
# (создаётся скриптом publish.sh или вручную)
docker compose -f docker-compose.production.yml up -d

# 3. Настройте SSL (самоподписанный или Let's Encrypt)
# См. секцию SSL ниже
```

### Вариант 2: Локальная установка через скрипт

```bash
chmod +x install.sh
./install.sh
```

Скрипт спросит:
1. Домен (например `fileshare.local`)
2. Тип сертификата (самоподписанный / Let's Encrypt)
3. Секретный URL для админки
4. Пароль для базы данных

### Вариант 3: Ручная сборка (для разработки)

```bash
# 1. Клонировать и перейти в директорию
cd fileshare

# 2. Скопировать .env
cp .env.example .env
# Отредактировать .env

# 3. Запустить через Docker Compose
docker compose up -d

# 4. Открыть в браузере
# https://localhost
```

### 📦 Публикация на Docker Hub

Для публикации образов на Docker Hub используйте скрипт `publish.sh`:

```bash
chmod +x publish.sh
./publish.sh -u your_dockerhub_username -v 1.0.0
```

Подробнее см. [PUBLISH.md](PUBLISH.md)

## 🔐 Админ-панель

1. Перейдите по секретному URL (указан при установке)
2. Создайте логин и пароль (минимум 12 символов, буквы, цифры, спецсимволы)
3. Управляйте настройками сервиса

## 📡 API

### Публичные эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/health` | Проверка работоспособности |
| GET | `/api/session` | Получить ID сессии |
| POST | `/api/files/upload` | Загрузить файл |
| GET | `/api/files` | Список файлов сессии |
| GET | `/api/files/:id/download` | Скачать файл |
| DELETE | `/api/files/:id` | Удалить файл |
| POST | `/api/texts` | Создать общий текст |
| GET | `/api/texts` | Список текстов сессии |
| GET | `/api/texts/:id` | Получить текст |
| DELETE | `/api/texts/:id` | Удалить текст |

### Админ-эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/admin/status` | Статус инициализации |
| POST | `/api/admin/setup` | Создание админа |
| POST | `/api/admin/login` | Авторизация |
| GET | `/api/admin/settings` | Получить настройки |
| PUT | `/api/admin/settings` | Обновить настройки |
| GET | `/api/admin/stats` | Статистика |

## 🧪 Тестирование

### Unit + API тесты (Jest)

```bash
cd backend
npm test
npm run test:coverage
```

### E2E тесты (Cypress)

```bash
npx cypress open
# или
npx cypress run
```

## 📁 Структура проекта

```
fileshare/
├── src/                    # Frontend (React)
│   ├── components/
│   ├── pages/
│   ├── store/
│   ├── App.tsx
│   └── main.tsx
├── backend/                # Backend (Express)
│   ├── src/
│   │   ├── config/         # Конфигурация
│   │   ├── controllers/    # Контроллеры
│   │   ├── middleware/     # Middleware
│   │   ├── routes/         # Маршруты
│   │   ├── services/       # Бизнес-логика
│   │   ├── utils/          # Утилиты
│   │   └── database/       # Миграции
│   ├── tests/              # Тесты
│   └── package.json
├── docker/
│   └── nginx/              # Конфигурация Nginx
├── cypress/                # E2E тесты
├── docker-compose.yml
├── Dockerfile.frontend
├── install.sh              # Скрипт установки
└── README.md
```

## 🛡 Безопасность

- HTTPS (самоподписанный или Let's Encrypt)
- Helmet.js для HTTP заголовков
- Rate limiting (100 запросов / 15 мин)
- JWT для авторизации администратора
- Пароль: минимум 12 символов, буквы, цифры, спецсимволы
- HttpOnly cookies для сессий
- CORS настроен на конкретный домен

## ⚙️ Настройки (через админку)

| Параметр | По умолчанию | Описание |
|----------|-------------|----------|
| `max_file_size` | 100 MB | Максимальный размер файла |
| `file_expiry_days` | 7 | Срок хранения файлов |
| `text_expiry_days` | 7 | Срок хранения текстов |
| `session_expiry_days` | 7 | Время жизни сессии |
| `max_files_per_session` | 50 | Максимум файлов на сессию |

## 📋 Принципы (SOLID)

- **S** — Single Responsibility: каждый сервис/контроллер отвечает за одну область
- **O** — Open/Closed: middleware можно расширять без модификации
- **L** — Liskov Substitution: интерфейсы сервисов заменяемы
- **I** — Interface Segregation: узкие интерфейсы контроллеров
- **D** — Dependency Inversion: сервисы не зависят от конкретной БД

## 📄 Лицензия

MIT
