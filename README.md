# FileShare — Сервис обмена файлами и текстом

Анонимный сервис для обмена файлами и текстом. Без регистрации, с автоматическим удалением по истечении срока.

## 🚀 Быстрая установка

```bash
curl -fsSL https://raw.githubusercontent.com/katana31337/FileShare2/refs/heads/main/install.sh | sudo sh
```

## 📋 Требования

- Docker (20.10+)
- Docker Compose (v2+)
- 512 MB RAM минимум
- 1 GB свободного места на диске
- Открытые порты 80 и 443

## 🔧 Ручная установка

```bash
# Клонировать репозиторий
git clone https://github.com/katana31337/FileShare2.git
cd FileShare2

# Запустить установку
chmod +x install.sh
./install.sh
```

## 📁 Структура проекта

```
.
├── frontend/           # React SPA
├── backend/            # Node.js API
├── e2e/                # E2E тесты (Playwright)
├── docker/             # Nginx конфигурация
├── .github/workflows/  # GitHub Actions
├── docker-compose.yml  # Локальная разработка
├── Dockerfile.frontend # Сборка frontend
├── install.sh          # Скрипт установки
└── TESTING.md          # Документация по тестированию
```

## 🏗️ Архитектура

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Nginx     │────▶│  Frontend   │     │  Backend    │
│  (80/443)   │     │  (React)    │     │  (Node.js)  │
└──────┬──────┘     └─────────────┘     └──────┬──────┘
       │                                        │
       │              ┌─────────────┐           │
       └─────────────▶│  PostgreSQL │◀──────────┘
                      │   (Portgres)│
                      └─────────────┘
```

### Контейнеры:
- **fileshare-nginx** — Reverse proxy, SSL termination
- **fileshare-frontend** — React SPA (nginx:alpine)
- **fileshare-backend** — Node.js API (port 3001)
- **fileshare-db** — PostgreSQL 16

## 🔐 Безопасность

- Автоматическая генерация паролей и секретов
- Секретный URL для доступа к админке
- HTTPS по умолчанию (самоподписанный или Let's Encrypt)
- HTTP security headers
- CORS ограничение
- Сессионные cookies с подписью
- Хеширование паролей (SHA-256)

## 🧪 Тестирование

Полная система тестирования включает:

### Unit Tests
```bash
npm test              # Frontend тесты
cd backend && npm test  # Backend тесты
```

### E2E Tests
```bash
npx playwright test   # Сквозные тесты
```

### Coverage
```bash
npm run test:coverage # Frontend покрытие
cd backend && npm run test:coverage  # Backend покрытие
```

Подробная документация: [TESTING.md](TESTING.md)

## 🚀 CI/CD

GitHub Actions автоматически запускает:

1. **CI Pipeline** — тесты, линтинг, сборка, Docker build, security scan
2. **E2E Tests** — Playwright тесты с отчётами
3. **Docker Build** — сборка и push образов в Docker Hub

### Workflows:
- `.github/workflows/ci.yml` — основной CI
- `.github/workflows/e2e.yml` — E2E тесты
- `.github/workflows/docker.yml` — Docker build и push

## 📦 Docker Hub образы

- `katana31337/fileshare-frontend`
- `katana31337/fileshare-backend`

## 🗑️ Удаление

```bash
docker compose down
rm -rf /datastore
```

## 📄 Лицензия

MIT

## 🔗 Ссылки

- [Документация по тестированию](TESTING.md)
- [GitHub Actions](.github/workflows/)
- [Docker Hub](https://hub.docker.com/u/katana31337)
