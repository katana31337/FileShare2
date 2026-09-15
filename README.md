# FileShare — Сервис обмена файлами и текстом

Анонимный сервис для обмена файлами и текстом. Без регистрации, с автоматическим удалением по истечении срока.

## 🚀 Быстрая установка

```bash
curl -fsSL https://raw.githubusercontent.com/katana31337/FileShare2/refs/heads/main/install.sh | sh
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
├── docker/             # Nginx конфигурация
├── docker-compose.yml  # Локальная разработка
├── docker-compose.production.yml  # Production из Docker Hub
├── Dockerfile.frontend # Сборка frontend
└── install.sh          # Скрипт установки
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
