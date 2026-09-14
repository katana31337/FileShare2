# Публикация на Docker Hub

Скрипт `publish.sh` автоматизирует сборку и публикацию Docker-образов FileShare на Docker Hub.

## Использование

### Базовое использование

```bash
chmod +x publish.sh
./publish.sh -u your_dockerhub_username -v 1.0.0
```

### Интерактивный режим

```bash
./publish.sh
```

Скрипт спросит:
- Docker Hub username
- Версию для публикации
- Подтверждение публикации

### Опции

```bash
./publish.sh [OPTIONS]

Опции:
  -u, --username USERNAME    Docker Hub username
  -v, --version VERSION      Версия для публикации (например: 1.0.0)
  --no-latest                Не тэгать как 'latest'
  --no-version               Не тэгать с версией
  --platforms PLATFORMS      Платформы для сборки (по умолчанию: linux/amd64,linux/arm64)
  -h, --help                 Показать справку
```

### Примеры

```bash
# Публикация версии 1.0.0 + latest
./publish.sh -u myuser -v 1.0.0

# Только версия, без latest
./publish.sh -u myuser -v 1.0.0 --no-latest

# Сборка только для amd64
./publish.sh -u myuser -v 1.0.0 --platforms linux/amd64

# Интерактивный режим
./publish.sh
```

## Что делает скрипт

1. **Проверяет требования**
   - Docker установлен
   - Docker Buildx доступен (для multi-arch)
   - Авторизация в Docker Hub

2. **Собирает образы**
   - Frontend (React + Nginx)
   - Backend (Node.js + Express)

3. **Тэгирует образы**
   - С версией: `username/fileshare-frontend:1.0.0`
   - Как latest: `username/fileshare-frontend:latest`

4. **Публикует на Docker Hub**
   - Push образов в registry

5. **Создаёт production docker-compose**
   - `docker-compose.production.yml` для развёртывания из Docker Hub

## Результаты

После выполнения скрипта будут созданы образы:

```
your_username/fileshare-frontend:1.0.0
your_username/fileshare-frontend:latest
your_username/fileshare-backend:1.0.0
your_username/fileshare-backend:latest
```

## Установка на сервере

После публикации используйте `docker-compose.production.yml`:

```bash
# 1. Скопируйте на сервер
scp docker-compose.production.yml user@server:/path/to/fileshare/

# 2. Создайте .env файл
cat > .env << EOF
DB_NAME=fileshare
DB_USER=fileshare
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret
COOKIE_SECRET=your_cookie_secret
ADMIN_SECRET_PATH=/your-secret-admin-path
CORS_ORIGIN=https://yourdomain.com
EOF

# 3. Настройте SSL (см. основной README)

# 4. Запустите
docker compose -f docker-compose.production.yml up -d
```

## Multi-arch сборка

По умолчанию скрипт собирает образы для:
- `linux/amd64` (x86_64)
- `linux/arm64` (ARM64, Apple Silicon, AWS Graviton)

Для сборки только для одной архитектуры:

```bash
./publish.sh -u myuser -v 1.0.0 --platforms linux/amd64
```

## Требования

- Docker 20.10+
- Docker Buildx (для multi-arch)
- Аккаунт Docker Hub
- Интернет для push образов

## Автоматизация (CI/CD)

### GitHub Actions

```yaml
name: Publish to Docker Hub

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Publish images
        run: |
          chmod +x publish.sh
          ./publish.sh \
            -u ${{ secrets.DOCKERHUB_USERNAME }} \
            -v ${{ github.event.release.tag_name }}
```

### GitLab CI

```yaml
publish:
  stage: deploy
  image: docker:20.10
  services:
    - docker:20.10-dind
  script:
    - docker login -u $DOCKERHUB_USERNAME -p $DOCKERHUB_TOKEN
    - chmod +x publish.sh
    - ./publish.sh -u $DOCKERHUB_USERNAME -v $CI_COMMIT_TAG
  only:
    - tags
```

## Обновление на сервере

Для обновления существующей установки:

```bash
# 1. Остановить текущие контейнеры
docker compose -f docker-compose.production.yml down

# 2. Скачать новые образы
docker compose -f docker-compose.production.yml pull

# 3. Запустить с новыми образами
docker compose -f docker-compose.production.yml up -d

# 4. Очистить старые образы
docker image prune -f
```

## Откат версии

Если нужно откатиться на предыдущую версию:

```bash
# 1. Измените версию в docker-compose.production.yml
# Замените image: username/fileshare-frontend:1.0.1
# На: image: username/fileshare-frontend:1.0.0

# 2. Перезапустите
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d
```

## Удаление образов из Docker Hub

```bash
# Через веб-интерфейс
# https://hub.docker.com/repositories/your_username

# Или через API
curl -X DELETE \
  -H "Authorization: JWT <token>" \
  https://hub.docker.com/v2/repositories/your_username/fileshare-frontend/tags/1.0.0/
```

## Troubleshooting

### Ошибка: "unauthorized: authentication required"

```bash
docker login
# Введите username и password/token от Docker Hub
```

### Ошибка: "buildx failed"

```bash
# Пересоздайте builder
docker buildx rm fileshare-builder
docker buildx create --name fileshare-builder --use
```

### Ошибка: "no space left on device"

```bash
# Очистите Docker
docker system prune -a
```

### Образы не пушатся

Проверьте:
1. Авторизацию: `docker info | grep Username`
2. Права на репозиторий в Docker Hub
3. Интернет-соединение

## Дополнительно

- Образы хранятся в Docker Hub бессрочно
- Бесплатный аккаунт: 1 приватный репозиторий, неограниченно публичных
- Pro аккаунт: неограниченно приватных репозиториев
