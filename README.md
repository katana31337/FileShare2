# FileShare — Сервис обмена файлами и текстом

Анонимный сервис для обмена файлами и текстом. Без регистрации, с автоматическим удалением по истечении срока.

## 🚀 Быстрая установка (одна команда)

```bash
curl -fsSL https://raw.githubusercontent.com/katana31337/FileShare2/refs/heads/main/install.sh | sh
```

### Установка с параметрами (без интерактивного ввода):

```bash
curl -fsSL https://raw.githubusercontent.com/katana31337/FileShare2/refs/heads/main/install.sh | \
  DOMAIN=fileshare.example.com \
  LETSENCRYPT_EMAIL=admin@example.com \
  SSL_TYPE=letsencrypt \
  VERSION=latest \
  sh
```

## 📋 Требования

- Docker (20.10+)
- Docker Compose (v2+)
- 512 MB RAM минимум
- 1 GB свободного места на диске
- Открытые порты 80 и 443

## ⚙️ Параметры установки

| Переменная | Описание | По умолчанию |
|-----------|----------|--------------|
| `DOMAIN` | Домен для сервиса | `fileshare.local` |
| `VERSION` | Версия образов Docker Hub | `latest` |
| `SSL_TYPE` | Тип SSL: `self-signed` или `letsencrypt` | `self-signed` |
| `LETSENCRYPT_EMAIL` | Email для Let's Encrypt | — |
| `ADMIN_SECRET_PATH` | Секретный URL для админки | автогенерация |
| `DB_PASSWORD` | Пароль для PostgreSQL | автогенерация |

## 📁 Структура после установки

```
/opt/fileshare/
├── docker-compose.yml    # Конфигурация контейнеров
├── .env                  # Переменные окружения
├── certs/                # SSL сертификаты
└── docker/
    └── nginx/
        ├── nginx.conf
        └── conf.d/
            └── default.conf

/datastore/
├── postgres/             # Данные PostgreSQL
└── uploads/              # Загруженные файлы
```

## 🔧 Управление

```bash
cd /opt/fileshare

# Логи
docker compose logs -f

# Перезапуск
docker compose restart

# Остановка
docker compose down

# Статус контейнеров
docker compose ps

# Обновление до новой версии
# Измените VERSION в .env, затем:
docker compose pull && docker compose up -d
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
cd /opt/fileshare
docker compose down
rm -rf /opt/fileshare /datastore
```

## 📄 Лицензия

MIT
