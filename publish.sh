#!/bin/sh

# =============================================================================
# FileShare — Docker Hub Publisher
# =============================================================================
# Скрипт для сборки и публикации образов на Docker Hub
# POSIX-совместимый (работает с sh, bash, dash)
# =============================================================================

set -e

# Colors (через printf для совместимости)
RED=''
GREEN=''
YELLOW=''
BLUE=''
NC=''

# Включаем цвета только если терминал поддерживает
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
fi

# Default values
DOCKER_USERNAME=""
VERSION=""
PUSH_LATEST=true
PUSH_VERSION=true
PLATFORMS="linux/amd64"

# Helper functions
print_header() {
    echo ""
    printf "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
    printf "${BLUE}  %s${NC}\n" "$1"
    printf "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
    echo ""
}

print_success() {
    printf "${GREEN}✓ %s${NC}\n" "$1"
}

print_warning() {
    printf "${YELLOW}⚠ %s${NC}\n" "$1"
}

print_error() {
    printf "${RED}✗ %s${NC}\n" "$1"
}

print_info() {
    printf "${BLUE}ℹ %s${NC}\n" "$1"
}

# Show usage
usage() {
    echo "Использование: $0 <username> [OPTIONS]"
    echo "       или:    $0 -u <username> [OPTIONS]"
    echo ""
    echo "Аргументы:"
    echo "  username                   Docker Hub username (обязательный)"
    echo ""
    echo "Опции:"
    echo "  -u, --username USERNAME    Docker Hub username"
    echo "  -v, --version VERSION      Версия для публикации (например: 1.0.0)"
    echo "  --no-latest                Не тэгать как 'latest'"
    echo "  --no-version               Не тэгать с версией"
    echo "  --platforms PLATFORMS      Платформа для сборки (по умолчанию: linux/amd64)"
    echo "  -h, --help                 Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  $0 myuser -v 1.0.0                           # Публикация 1.0.0 под myuser"
    echo "  $0 -u myuser -v 1.0.0                        # То же самое через флаг"
    echo "  $0 myuser -v 1.0.0 --no-latest               # Только версия, без latest"
    echo "  $0 myuser -v 1.0.0 --platforms linux/arm64   # Сборка для ARM64"
    echo ""
}

# Parse arguments
while [ $# -gt 0 ]; do
    case $1 in
        -u|--username)
            DOCKER_USERNAME="$2"
            shift 2
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        --no-latest)
            PUSH_LATEST=false
            shift
            ;;
        --no-version)
            PUSH_VERSION=false
            shift
            ;;
        --platforms)
            PLATFORMS="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        -*)
            print_error "Неизвестная опция: $1"
            usage
            exit 1
            ;;
        *)
            # Позиционный аргумент — username
            if [ -z "$DOCKER_USERNAME" ]; then
                DOCKER_USERNAME="$1"
            else
                print_error "Неожиданный аргумент: $1"
                usage
                exit 1
            fi
            shift
            ;;
    esac
done

# Check if platform contains comma (multi-arch)
is_multi_platform() {
    case "$1" in
        *,*) return 0 ;;
        *) return 1 ;;
    esac
}

# Check requirements
check_requirements() {
    print_header "Проверка требований"

    # Check Docker
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker не установлен!"
        exit 1
    fi
    print_success "Docker установлен: $(docker --version)"

    # Check Docker Buildx (нужен только для multi-arch)
    if ! docker buildx version >/dev/null 2>&1; then
        if is_multi_platform "$PLATFORMS"; then
            print_error "Docker Buildx необходим для multi-arch сборки!"
            exit 1
        else
            print_info "Docker Buildx не найден (не требуется для single-platform)"
            USE_BUILDX=false
        fi
    else
        print_success "Docker Buildx доступен"
        USE_BUILDX=true
    fi

    # Check Docker Hub login
    if ! docker info 2>&1 | grep -q "Username"; then
        print_warning "Не авторизован в Docker Hub"
        echo ""
        printf "${YELLOW}Введите данные для входа в Docker Hub:${NC}\n"
        docker login
    else
        print_success "Авторизован в Docker Hub"
    fi

    echo ""
}

# Collect configuration
collect_config() {
    print_header "Конфигурация публикации"

    # Docker Hub username (обязательный параметр)
    if [ -z "$DOCKER_USERNAME" ]; then
        print_error "Docker Hub username не указан!"
        echo ""
        printf "${YELLOW}Использование:${NC}\n"
        echo "  $0 <username> -v <version>"
        echo ""
        printf "${YELLOW}Пример:${NC}\n"
        echo "  $0 myuser -v 1.0.0"
        echo ""
        printf "Или используйте флаг ${BLUE}-u${NC}: $0 -u myuser -v 1.0.0\n"
        exit 1
    fi
    print_info "Docker Hub: $DOCKER_USERNAME"

    # Version
    if [ -z "$VERSION" ]; then
        echo ""
        printf "${YELLOW}Введите версию для публикации (например: 1.0.0):${NC}\n"
        printf "> "
        read -r VERSION
        if [ -z "$VERSION" ]; then
            print_error "Версия обязательна!"
            exit 1
        fi
    fi
    print_info "Версия: $VERSION"

    # Image names
    FRONTEND_IMAGE="$DOCKER_USERNAME/fileshare-frontend"
    BACKEND_IMAGE="$DOCKER_USERNAME/fileshare-backend"
    
    echo ""
    print_info "Образы для публикации:"
    echo "  - $FRONTEND_IMAGE:$VERSION"
    echo "  - $BACKEND_IMAGE:$VERSION"
    if [ "$PUSH_LATEST" = true ]; then
        echo "  - $FRONTEND_IMAGE:latest"
        echo "  - $BACKEND_IMAGE:latest"
    fi
    echo ""

    # Confirm
    printf "${YELLOW}Продолжить публикацию? [Y/n]:${NC}\n"
    printf "> "
    read -r CONFIRM
    CONFIRM=${CONFIRM:-Y}
    
    case "$CONFIRM" in
        [Yy]*) ;;
        *)
            print_info "Публикация отменена"
            exit 0
            ;;
    esac

    echo ""
}

# Build images
build_images() {
    print_header "Сборка образов"

    if is_multi_platform "$PLATFORMS"; then
        # Multi-arch сборка через buildx
        if [ "$USE_BUILDX" = true ]; then
            print_info "Использование Docker Buildx для multi-arch сборки..."
            
            # Create builder if not exists
            if ! docker buildx inspect fileshare-builder >/dev/null 2>&1; then
                docker buildx create --name fileshare-builder --use
            else
                docker buildx use fileshare-builder
            fi

            # Build frontend
            print_info "Сборка frontend образа..."
            if [ "$PUSH_LATEST" = true ]; then
                docker buildx build \
                    --platform "$PLATFORMS" \
                    --file Dockerfile.frontend \
                    --tag "$FRONTEND_IMAGE:$VERSION" \
                    --tag "$FRONTEND_IMAGE:latest" \
                    --push \
                    .
            else
                docker buildx build \
                    --platform "$PLATFORMS" \
                    --file Dockerfile.frontend \
                    --tag "$FRONTEND_IMAGE:$VERSION" \
                    --push \
                    .
            fi

            print_success "Frontend образ собран и опубликован"

            # Build backend
            print_info "Сборка backend образа..."
            if [ "$PUSH_LATEST" = true ]; then
                docker buildx build \
                    --platform "$PLATFORMS" \
                    --file backend/Dockerfile \
                    --tag "$BACKEND_IMAGE:$VERSION" \
                    --tag "$BACKEND_IMAGE:latest" \
                    --push \
                    ./backend
            else
                docker buildx build \
                    --platform "$PLATFORMS" \
                    --file backend/Dockerfile \
                    --tag "$BACKEND_IMAGE:$VERSION" \
                    --push \
                    ./backend
            fi

            print_success "Backend образ собран и опубликован"
        else
            print_error "Buildx необходим для multi-arch сборки!"
            exit 1
        fi
    else
        # Single platform - используем обычный docker build (быстрее)
        print_info "Сборка для платформы: $PLATFORMS"

        # Build frontend
        print_info "Сборка frontend образа..."
        if [ "$PUSH_LATEST" = true ]; then
            docker build \
                --file Dockerfile.frontend \
                --tag "$FRONTEND_IMAGE:$VERSION" \
                --tag "$FRONTEND_IMAGE:latest" \
                .
        else
            docker build \
                --file Dockerfile.frontend \
                --tag "$FRONTEND_IMAGE:$VERSION" \
                .
        fi

        print_success "Frontend образ собран"

        # Build backend
        print_info "Сборка backend образа..."
        if [ "$PUSH_LATEST" = true ]; then
            docker build \
                --file backend/Dockerfile \
                --tag "$BACKEND_IMAGE:$VERSION" \
                --tag "$BACKEND_IMAGE:latest" \
                ./backend
        else
            docker build \
                --file backend/Dockerfile \
                --tag "$BACKEND_IMAGE:$VERSION" \
                ./backend
        fi

        print_success "Backend образ собран"
    fi

    echo ""
}

# Push images
push_images() {
    # Push только для single platform сборки (multi-arch пушится через buildx)
    if ! is_multi_platform "$PLATFORMS"; then
        print_header "Публикация образов"

        # Push frontend
        print_info "Публикация frontend образа..."
        docker push "$FRONTEND_IMAGE:$VERSION"
        if [ "$PUSH_LATEST" = true ]; then
            docker push "$FRONTEND_IMAGE:latest"
        fi
        print_success "Frontend опубликован"

        # Push backend
        print_info "Публикация backend образа..."
        docker push "$BACKEND_IMAGE:$VERSION"
        if [ "$PUSH_LATEST" = true ]; then
            docker push "$BACKEND_IMAGE:latest"
        fi
        print_success "Backend опубликован"

        echo ""
    fi
}

# Create docker-compose for production
create_production_compose() {
    print_header "Создание production docker-compose"

    cat > docker-compose.production.yml << COMPOSEFILE
version: '3.8'

# FileShare Production Deployment
# Images from Docker Hub: $DOCKER_USERNAME

services:
  db:
    image: postgres:16-alpine
    container_name: fileshare-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: \${DB_NAME:-fileshare}
      POSTGRES_USER: \${DB_USER:-fileshare}
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    volumes:
      - /datastore/postgres:/var/lib/postgresql/data
    networks:
      - fileshare-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER:-fileshare}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: $BACKEND_IMAGE:$VERSION
    container_name: fileshare-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3001
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: \${DB_NAME:-fileshare}
      DB_USER: \${DB_USER:-fileshare}
      DB_PASSWORD: \${DB_PASSWORD}
      JWT_SECRET: \${JWT_SECRET}
      JWT_EXPIRES_IN: \${JWT_EXPIRES_IN:-24h}
      MAX_FILE_SIZE: \${MAX_FILE_SIZE:-104857600}
      UPLOAD_PATH: /app/uploads
      SESSION_EXPIRY_DAYS: \${SESSION_EXPIRY_DAYS:-7}
      SESSION_COOKIE_NAME: \${SESSION_COOKIE_NAME:-fs_sid}
      COOKIE_SECRET: \${COOKIE_SECRET}
      ADMIN_SECRET_PATH: \${ADMIN_SECRET_PATH}
      CORS_ORIGIN: \${CORS_ORIGIN}
    volumes:
      - /datastore/uploads:/app/uploads
    depends_on:
      db:
        condition: service_healthy
    networks:
      - fileshare-network

  frontend:
    image: $FRONTEND_IMAGE:$VERSION
    container_name: fileshare-frontend
    restart: unless-stopped
    networks:
      - fileshare-network

  nginx:
    image: nginx:alpine
    container_name: fileshare-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certs:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    networks:
      - fileshare-network

networks:
  fileshare-network:
    driver: bridge
COMPOSEFILE

    print_success "Создан docker-compose.production.yml"
    echo ""
}

# Print summary
print_summary() {
    print_header "Публикация завершена!"

    printf "${GREEN}═══════════════════════════════════════════════════════════════${NC}\n"
    echo ""
    printf "  ${BLUE}Образы опубликованы на Docker Hub!${NC}\n"
    echo ""
    printf "  ${YELLOW}Frontend:${NC}\n"
    echo "  $FRONTEND_IMAGE:$VERSION"
    if [ "$PUSH_LATEST" = true ]; then
        echo "  $FRONTEND_IMAGE:latest"
    fi
    echo ""
    printf "  ${YELLOW}Backend:${NC}\n"
    echo "  $BACKEND_IMAGE:$VERSION"
    if [ "$PUSH_LATEST" = true ]; then
        echo "  $BACKEND_IMAGE:latest"
    fi
    echo ""
    printf "  ${YELLOW}Установка на сервере:${NC}\n"
    echo "  1. Скопируйте docker-compose.production.yml на сервер"
    echo "  2. Создайте .env файл с настройками"
    echo "  3. Запустите: docker compose -f docker-compose.production.yml up -d"
    echo ""
    printf "  ${YELLOW}Полезные команды:${NC}\n"
    echo "  docker pull $FRONTEND_IMAGE:$VERSION"
    echo "  docker pull $BACKEND_IMAGE:$VERSION"
    echo ""
    printf "${GREEN}═══════════════════════════════════════════════════════════════${NC}\n"
}

# =============================================================================
# Main
# =============================================================================

main() {
    echo ""
    printf "${BLUE}"
    echo "  ██████╗ ██╗   ██╗██╗██╗     ██╗      ██████╗ ██████╗ ███╗   ██╗███████╗██╗"
    echo "  ██╔══██╗██║   ██║██║██║     ██║     ██╔════╝██╔═══██╗████╗  ██║██╔════╝██║"
    echo "  ██████╔╝██║   ██║██║██║     ██║     ██║     ██║   ██║██╔██╗ ██║█████╗  ██║"
    echo "  ██╔═══╝ ██║   ██║██║██║     ██║     ██║     ██║   ██║██║╚██╗██║██╔══╝  ╚═╝"
    echo "  ██║     ╚██████╔╝██║███████╗███████╗╚██████╗╚██████╔╝██║ ╚████║███████╗██╗"
    echo "  ╚═╝      ╚═════╝ ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝"
    echo ""
    printf "  ${NC}Публикация на Docker Hub\n"
    echo ""

    check_requirements
    collect_config
    build_images
    push_images
    create_production_compose
    print_summary
}

# Run
main "$@"
