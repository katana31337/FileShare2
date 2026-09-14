#!/bin/bash

# =============================================================================
# FileShare — Docker Hub Publisher
# =============================================================================
# Скрипт для сборки и публикации образов на Docker Hub
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
DOCKER_USERNAME=""
VERSION=""
PUSH_LATEST=true
PUSH_VERSION=true
PLATFORMS="linux/amd64,linux/arm64"

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Show usage
usage() {
    echo "Использование: $0 [OPTIONS]"
    echo ""
    echo "Опции:"
    echo "  -u, --username USERNAME    Docker Hub username"
    echo "  -v, --version VERSION      Версия для публикации (например: 1.0.0)"
    echo "  --no-latest                Не тэгать как 'latest'"
    echo "  --no-version               Не тэгать с версией"
    echo "  --platforms PLATFORMS      Платформы для сборки (по умолчанию: linux/amd64,linux/arm64)"
    echo "  -h, --help                 Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  $0 -u myuser -v 1.0.0"
    echo "  $0 --username myuser --version 1.0.0"
    echo "  $0 -u myuser -v 1.0.0 --no-latest"
    echo ""
}

# Parse arguments
while [[ $# -gt 0 ]]; do
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
        *)
            print_error "Неизвестная опция: $1"
            usage
            exit 1
            ;;
    esac
done

# Check requirements
check_requirements() {
    print_header "Проверка требований"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker не установлен!"
        exit 1
    fi
    print_success "Docker установлен"

    # Check Docker Buildx (для multi-arch)
    if ! docker buildx version &> /dev/null; then
        print_warning "Docker Buildx не найден, будет использоваться стандартная сборка"
        USE_BUILDX=false
    else
        print_success "Docker Buildx доступен"
        USE_BUILDX=true
    fi

    # Check Docker Hub login
    if ! docker info 2>&1 | grep -q "Username"; then
        print_warning "Не авторизован в Docker Hub"
        echo ""
        echo -e "${YELLOW}Введите данные для входа в Docker Hub:${NC}"
        docker login
    else
        print_success "Авторизован в Docker Hub"
    fi

    echo ""
}

# Collect configuration
collect_config() {
    print_header "Конфигурация публикации"

    # Docker Hub username
    if [ -z "$DOCKER_USERNAME" ]; then
        echo -e "${YELLOW}Введите Docker Hub username:${NC}"
        read -p "> " DOCKER_USERNAME
        if [ -z "$DOCKER_USERNAME" ]; then
            print_error "Username обязателен!"
            exit 1
        fi
    fi
    print_info "Docker Hub: $DOCKER_USERNAME"

    # Version
    if [ -z "$VERSION" ]; then
        echo ""
        echo -e "${YELLOW}Введите версию для публикации (например: 1.0.0):${NC}"
        read -p "> " VERSION
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
    echo -e "${YELLOW}Продолжить публикацию? [Y/n]:${NC}"
    read -p "> " CONFIRM
    CONFIRM=${CONFIRM:-Y}
    
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        print_info "Публикация отменена"
        exit 0
    fi

    echo ""
}

# Build images
build_images() {
    print_header "Сборка образов"

    if [ "$USE_BUILDX" = true ]; then
        print_info "Использование Docker Buildx для multi-arch сборки..."
        
        # Create builder if not exists
        if ! docker buildx inspect fileshare-builder &> /dev/null; then
            docker buildx create --name fileshare-builder --use
        else
            docker buildx use fileshare-builder
        fi

        # Build frontend
        print_info "Сборка frontend образа..."
        docker buildx build \
            --platform $PLATFORMS \
            --file Dockerfile.frontend \
            --tag $FRONTEND_IMAGE:$VERSION \
            $( [ "$PUSH_LATEST" = true ] && echo "--tag $FRONTEND_IMAGE:latest" ) \
            --push \
            .

        print_success "Frontend образ собран и опубликован"

        # Build backend
        print_info "Сборка backend образа..."
        docker buildx build \
            --platform $PLATFORMS \
            --file backend/Dockerfile \
            --tag $BACKEND_IMAGE:$VERSION \
            $( [ "$PUSH_LATEST" = true ] && echo "--tag $BACKEND_IMAGE:latest" ) \
            --push \
            ./backend

        print_success "Backend образ собран и опубликован"

    else
        print_warning "Buildx недоступен, сборка для текущей платформы..."

        # Build frontend
        print_info "Сборка frontend образа..."
        docker build \
            --file Dockerfile.frontend \
            --tag $FRONTEND_IMAGE:$VERSION \
            $( [ "$PUSH_LATEST" = true ] && echo "--tag $FRONTEND_IMAGE:latest" ) \
            .

        # Build backend
        print_info "Сборка backend образа..."
        docker build \
            --file backend/Dockerfile \
            --tag $BACKEND_IMAGE:$VERSION \
            $( [ "$PUSH_LATEST" = true ] && echo "--tag $BACKEND_IMAGE:latest" ) \
            ./backend

        print_success "Образы собраны"
    fi

    echo ""
}

# Push images
push_images() {
    if [ "$USE_BUILDX" = false ]; then
        print_header "Публикация образов"

        # Push frontend
        print_info "Публикация frontend образа..."
        docker push $FRONTEND_IMAGE:$VERSION
        if [ "$PUSH_LATEST" = true ]; then
            docker push $FRONTEND_IMAGE:latest
        fi
        print_success "Frontend опубликован"

        # Push backend
        print_info "Публикация backend образа..."
        docker push $BACKEND_IMAGE:$VERSION
        if [ "$PUSH_LATEST" = true ]; then
            docker push $BACKEND_IMAGE:latest
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
      - postgres_/var/lib/postgresql/data
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
      - uploads_/app/uploads
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

volumes:
  postgres_
    driver: local
  uploads_
    driver: local

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

    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${BLUE}Образы опубликованы на Docker Hub!${NC}"
    echo ""
    echo -e "  ${YELLOW}Frontend:${NC}"
    echo -e "  $FRONTEND_IMAGE:$VERSION"
    if [ "$PUSH_LATEST" = true ]; then
        echo -e "  $FRONTEND_IMAGE:latest"
    fi
    echo ""
    echo -e "  ${YELLOW}Backend:${NC}"
    echo -e "  $BACKEND_IMAGE:$VERSION"
    if [ "$PUSH_LATEST" = true ]; then
        echo -e "  $BACKEND_IMAGE:latest"
    fi
    echo ""
    echo -e "  ${YELLOW}Установка на сервере:${NC}"
    echo -e "  1. Скопируйте docker-compose.production.yml на сервер"
    echo -e "  2. Создайте .env файл с настройками"
    echo -e "  3. Запустите: docker compose -f docker-compose.production.yml up -d"
    echo ""
    echo -e "  ${YELLOW}Полезные команды:${NC}"
    echo -e "  docker pull $FRONTEND_IMAGE:$VERSION"
    echo -e "  docker pull $BACKEND_IMAGE:$VERSION"
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
}

# =============================================================================
# Main
# =============================================================================

main() {
    echo ""
    echo -e "${BLUE}"
    echo "  ██████╗ ██╗   ██╗██╗██╗     ██╗      ██████╗ ██████╗ ███╗   ██╗███████╗██╗"
    echo "  ██╔══██╗██║   ██║██║██║     ██║     ██╔════╝██╔═══██╗████╗  ██║██╔════╝██║"
    echo "  ██████╔╝██║   ██║██║██║     ██║     ██║     ██║   ██║██╔██╗ ██║█████╗  ██║"
    echo "  ██╔═══╝ ██║   ██║██║██║     ██║     ██║     ██║   ██║██║╚██╗██║██╔══╝  ╚═╝"
    echo "  ██║     ╚██████╔╝██║███████╗███████╗╚██████╗╚██████╔╝██║ ╚████║███████╗██╗"
    echo "  ╚═╝      ╚═════╝ ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝"
    echo ""
    echo -e "  ${NC}Публикация на Docker Hub"
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
