# Публикация на Docker Hub

Скрипт `publish.sh` автоматизирует сборку и публикацию Docker-образов FileShare на Docker Hub.

## Использование

### Базовое использование

```bash
chmod +x publish.sh
./publish.sh -u katana31337 -v 1.0.0
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
# Публикация версии 1.0.0 + latest (быстрая сборка для amd64)
./publish.sh -v 1.0.0

# Только версия, без latest
./publish.sh -v 1.0.0 --no-latest

# Публикация под другим пользователем
./publish.sh -u myuser -v 1.0.0

# Сборка для ARM64 (если нужно, будет использоваться buildx)
./publish.sh -v 1.0.0 --platforms linux/arm64

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
katana31337/fileshare-frontend:1.0.0
katana31337/fileshare-frontend:latest
katana31337/fileshare-backend:1.0.0
katana31337/fileshare-backend:latest
```

## Установка на сервере

После публикации используйте `install.sh` для автоматической установки:

```bash
# На сервере:
chmod +x install.sh
./install.sh
```

Скрипт автоматически загрузит образы с Docker Hub (katana31337) и настроит всё необходимое.

Или вручную с `docker-compose.production.yml`:

```bash
# 1. Скопируйте на сервер
scp docker-compose.production.yml user@server:/path/to/fileshare/

# 2. Создайте .env файл
cat > .env << EOF
VERSION=1.0.0
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

## Сборка под разные платформы

По умолчанию скрипт собирает образы для `linux/amd64` (x86_64, обычные ПК/серверы) — это быстрая сборка через обычный `docker build`.

Если нужна сборка для ARM64 (Apple Silicon, Raspberry Pi, AWS Graviton):

```bash
./publish.sh -v 1.0.0 --platforms linux/arm64
```

Для multi-arch сборки (несколько платформ одновременно) используется Docker Buildx:

```bash
./publish.sh -v 1.0.0 --platforms linux/amd64,linux/arm64
```

**Примечание:** Single-platform сборка (по умолчанию) значительно быстрее, так как не использует Buildx.

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
          username: katana31337
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Publish images
        run: |
          chmod +x publish.sh
          ./publish.sh \
            -u katana31337 \
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
    - docker login -u katana31337 -p $DOCKERHUB_TOKEN
    - chmod +x publish.sh
    - ./publish.sh -u katana31337 -v $CI_COMMIT_TAG
  only:
    - tags
```

## Обновление на сервере

Для обновления существующей установки:

```bash
# 1. Измените VERSION в .env на новую версию
nano .env

# 2. Остановить текущие контейнеры
docker compose down

# 3. Скачать новые образы из Docker Hub
docker compose pull

# 4. Запустить с новыми образами
docker compose up -d

# 5. Очистить старые образы
docker image prune -f
```

Или используйте install.sh заново — он спросит новую версию и обновит всё автоматически.

## Откат версии

Если нужно откатиться на предыдущую версию:

```bash
# 1. Измените VERSION в .env на предыдущую версию
nano .env

# 2. Перезапустите
docker compose down
docker compose pull
docker compose up -d
```

## Удаление образов из Docker Hub

```bash
# Через веб-интерфейс
# https://hub.docker.com/repositories/katana31337

# Или через API
curl -X DELETE \
  -H "Authorization: JWT <token>" \
  https://hub.docker.com/v2/repositories/katana31337/fileshare-frontend/tags/1.0.0/
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
