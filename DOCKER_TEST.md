# Docker Compose для тестирования

Этот файл используется для запуска тестового окружения в CI/CD pipeline.

## Отличия от основного docker-compose.yml

- **Нет volume mounts на /datastore** — все данные хранятся внутри контейнеров
- **Нет SSL** — используется только HTTP (порт 80)
- **Нет certbot** — не нужен для тестов
- **Встроенный config.json** — конфигурация встроена в образ frontend

## Использование

### Локально

```bash
# Запустить тестовое окружение
docker compose -f docker-compose.test.yml up -d

# Проверить статус
docker compose -f docker-compose.test.yml ps

# Посмотреть логи
docker compose -f docker-compose.test.yml logs -f

# Остановить и удалить
docker compose -f docker-compose.test.yml down -v
```

### В GitHub Actions

Используется автоматически в `.github/workflows/e2e.yml`:

```yaml
- name: Start services
  run: |
    docker compose -f docker-compose.test.yml up -d
    sleep 30

- name: Wait for services
  run: |
    timeout 60 bash -c 'until curl -f http://localhost/api/health; do sleep 2; done'
```

## Доступ к сервисам

- **Frontend:** http://localhost
- **Backend API:** http://localhost/api
- **Health Check:** http://localhost/api/health

## Переменные окружения

Все переменные заданы явно в файле:

```env
DB_PASSWORD=test_password
JWT_SECRET=test_jwt_secret_for_ci
COOKIE_SECRET=test_cookie_secret_for_ci
ADMIN_SECRET_PATH=/test-admin-secret
CORS_ORIGIN=http://localhost
```

## Конфигурация frontend

Файл `frontend/public/config.json` встраивается в образ:

```json
{
  "adminSecretPath": "test-admin-secret"
}
```

## Важные отличия от production

| Параметр | Production | Test |
|----------|-----------|------|
| SSL | ✅ HTTPS (443) | ❌ HTTP (80) |
| Data persistence | ✅ /datastore | ❌ In-container |
| Certbot | ✅ Let's Encrypt | ❌ Not included |
| Config source | ✅ Volume mount | ✅ Built-in |
| Ports | 80 + 443 | 80 only |

## Когда использовать

- ✅ **CI/CD pipeline** — для E2E тестов
- ✅ **Локальная разработка** — быстрый запуск без настройки SSL
- ✅ **Демо** — для быстрого показа функциональности
- ❌ **Production** — используйте основной `docker-compose.yml`
