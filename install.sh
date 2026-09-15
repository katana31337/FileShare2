#!/bin/sh

# =============================================================================
# FileShare — Installation Script
# =============================================================================
# Установка FileShare из Docker Hub (katana31337)
# 
# Использование:
#   curl -fsSL https://raw.githubusercontent.com/katana31337/FileShare2/refs/heads/main/install.sh | sh
#
# Или с параметрами:
#   curl -fsSL https://raw.githubusercontent.com/katana31337/FileShare2/refs/heads/main/install.sh | \
#     DOMAIN=fileshare.example.com \
#     LETSENCRYPT_EMAIL=admin@example.com \
#     SSL_TYPE=letsencrypt \
#     sh
#
# POSIX-совместимый (работает с sh, bash, dash)
# =============================================================================

set -e

# GitHub Repository
GITHUB_REPO="katana31337/FileShare2"
GITHUB_BRANCH="main"
GITHUB_RAW="https://raw.githubusercontent.com/${GITHUB_REPO}/refs/heads/${GITHUB_BRANCH}"

# Docker Hub
DOCKER_USER="katana31337"
FRONTEND_IMAGE="$DOCKER_USER/fileshare-frontend"
BACKEND_IMAGE="$DOCKER_USER/fileshare-backend"

# Installation directory
INSTALL_DIR="/opt/fileshare"
DATASTORE_PATH="/datastore"

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

# Helper functions
print_header() {
    echo ""
    printf "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
    printf "${BLUE}  %s${NC}\n" "$1"
    printf "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
    echo ""
}

print_success() { printf "${GREEN}✓ %s${NC}\n" "$1"; }
print_warning() { printf "${YELLOW}⚠ %s${NC}\n" "$1"; }
print_error()   { printf "${RED}✗ %s${NC}\n" "$1"; }
print_info()    { printf "${BLUE}ℹ %s${NC}\n" "$1"; }

# Check if running in non-interactive mode
is_interactive() {
    [ -t 0 ]
}

# Check prerequisites
check_requirements() {
    print_header "Проверка требований"

    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker не установлен!"
        echo "Установите Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker установлен: $(docker --version)"

    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon не запущен!"
        echo "Запустите: sudo systemctl start docker"
        exit 1
    fi
    print_success "Docker daemon запущен"

    # Check docker compose
    if command -v docker-compose >/dev/null 2>&1; then
        print_success "Docker Compose: $(docker-compose --version)"
        COMPOSE_CMD="docker-compose"
    elif docker compose version >/dev/null 2>&1; then
        print_success "Docker Compose: $(docker compose version)"
        COMPOSE_CMD="docker compose"
    else
        print_error "Docker Compose не установлен!"
        exit 1
    fi

    echo ""
}

# Generate random password
generate_password() {
    length=${1:-32}
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -base64 48 | tr -dc 'a-zA-Z0-9!@#$%^&*' | head -c "$length"
    else
        # Fallback: use /dev/urandom
        tr -dc 'a-zA-Z0-9!@#$%^&*' < /dev/urandom | head -c "$length"
    fi
}

# Generate random string
generate_random_string() {
    length=${1:-32}
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -hex "$length"
    else
        tr -dc 'a-f0-9' < /dev/urandom | head -c "$((length * 2))"
    fi
}

# Collect configuration
collect_config() {
    print_header "Конфигурация проекта"

    # Version (from env or interactive)
    if [ -n "$VERSION" ]; then
        print_info "Версия: $VERSION (из окружения)"
    elif is_interactive; then
        printf "${YELLOW}Введите версию FileShare для установки (или Enter для latest):${NC}\n"
        printf "> "
        read -r VERSION_INPUT
        VERSION=${VERSION_INPUT:-latest}
        print_info "Версия: $VERSION"
    else
        VERSION="latest"
        print_info "Версия: $VERSION (non-interactive)"
    fi

    # Domain (from env or interactive)
    if [ -n "$DOMAIN" ]; then
        print_info "Домен: $DOMAIN (из окружения)"
    elif is_interactive; then
        echo ""
        printf "${YELLOW}Введите домен для сервиса:${NC}\n"
        echo "  (например: fileshare.local, files.example.com)"
        printf "> "
        read -r DOMAIN
        DOMAIN=${DOMAIN:-fileshare.local}
        print_info "Домен: $DOMAIN"
    else
        DOMAIN="fileshare.local"
        print_info "Домен: $DOMAIN (по умолчанию)"
    fi

    # SSL Type (from env or interactive)
    if [ -n "$SSL_TYPE" ]; then
        print_info "Тип SSL: $SSL_TYPE (из окружения)"
    elif is_interactive; then
        echo ""
        printf "${YELLOW}Выберите тип SSL сертификата:${NC}\n"
        echo "  1) Самоподписанный сертификат (для локальной разработки)"
        echo "  2) Let's Encrypt (для публичного домена)"
        echo ""
        printf "Выберите [1/2] (по умолчанию: 1): "
        read -r SSL_CHOICE
        SSL_CHOICE=${SSL_CHOICE:-1}

        if [ "$SSL_CHOICE" = "2" ]; then
            SSL_TYPE="letsencrypt"
            print_info "Тип: Let's Encrypt"
            
            echo ""
            printf "${YELLOW}Введите email для Let's Encrypt:${NC}\n"
            printf "> "
            read -r LETSENCRYPT_EMAIL
            if [ -z "$LETSENCRYPT_EMAIL" ]; then
                print_error "Email обязателен для Let's Encrypt!"
                exit 1
            fi
        else
            SSL_TYPE="self-signed"
            print_info "Тип: Самоподписанный сертификат"
        fi
    else
        SSL_TYPE=${SSL_TYPE:-self-signed}
        print_info "Тип SSL: $SSL_TYPE (по умолчанию)"
    fi

    # Let's Encrypt email from env
    if [ -n "$LETSENCRYPT_EMAIL" ]; then
        print_info "Email для Let's Encrypt: $LETSENCRYPT_EMAIL"
    fi

    # Admin secret path (from env or auto-generate)
    if [ -n "$ADMIN_SECRET_PATH" ]; then
        print_info "Секретный URL: $ADMIN_SECRET_PATH (из окружения)"
    else
        ADMIN_PATH=$(generate_random_string 16)
        ADMIN_SECRET_PATH="/${ADMIN_PATH}"
        print_info "Секретный URL: $ADMIN_SECRET_PATH (автогенерация)"
    fi

    # Database password (from env or auto-generate)
    if [ -n "$DB_PASSWORD" ]; then
        print_info "Пароль БД: задан из окружения"
    else
        DB_PASSWORD=$(generate_password 24)
        print_info "Пароль БД: сгенерирован автоматически"
    fi

    # Generate secrets
    JWT_SECRET=$(generate_random_string 32)
    COOKIE_SECRET=$(generate_random_string 32)

    echo ""
    print_success "Конфигурация собрана!"
}

# Create installation directory
create_install_dir() {
    print_header "Создание директории установки"

    if [ ! -d "$INSTALL_DIR" ]; then
        print_info "Создание директории $INSTALL_DIR..."
        mkdir -p "$INSTALL_DIR"
        chmod 755 "$INSTALL_DIR"
        print_success "Директория $INSTALL_DIR создана"
    else
        print_info "Директория $INSTALL_DIR уже существует"
    fi

    cd "$INSTALL_DIR"
    print_success "Рабочая директория: $INSTALL_DIR"
}

# Create datastore directory
create_datastore() {
    print_header "Создание хранилища данных"

    if [ ! -d "$DATASTORE_PATH" ]; then
        print_info "Создание директории $DATASTORE_PATH..."
        mkdir -p "$DATASTORE_PATH"
        chmod 755 "$DATASTORE_PATH"
        print_success "Директория $DATASTORE_PATH создана"
    else
        print_info "Директория $DATASTORE_PATH уже существует"
    fi

    # Create subdirectories
    mkdir -p "$DATASTORE_PATH/uploads"
    mkdir -p "$DATASTORE_PATH/postgres"
    
    print_success "Структура хранилища готова"
}

# Generate SSL certificates
setup_ssl() {
    print_header "Настройка SSL"

    mkdir -p certs

    if [ "$SSL_TYPE" = "self-signed" ]; then
        print_info "Генерация самоподписанного сертификата..."
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout certs/key.pem \
            -out certs/cert.pem \
            -subj "/C=RU/ST=Local/L=Local/O=FileShare/CN=$DOMAIN" \
            -addext "subjectAltName=DNS:$DOMAIN,DNS:localhost,IP:127.0.0.1" \
            2>/dev/null
        
        print_success "Самоподписанный сертификат создан"
        print_warning "Браузер будет предупреждать о недоверенном сертификате — это нормально"

    elif [ "$SSL_TYPE" = "letsencrypt" ]; then
        print_info "Получение сертификата Let's Encrypt..."
        
        mkdir -p docker/nginx/certbot
        
        # Временный nginx конфиг для ACME challenge
        cat > docker/nginx/conf.d/default.conf << LECONF
server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}
LECONF

        # Запускаем nginx временно
        $COMPOSE_CMD up -d nginx
        sleep 5

        # Получаем сертификат
        docker run --rm \
            -v ./certs:/etc/letsencrypt \
            -v ./docker/nginx/certbot:/var/www/certbot \
            certbot/certbot certonly \
            --webroot \
            --webroot-path=/var/www/certbot \
            --email "$LETSENCRYPT_EMAIL" \
            --agree-tos \
            --no-eff-email \
            -d "$DOMAIN"

        $COMPOSE_CMD stop nginx

        # Создаём SSL конфиг
        cat > docker/nginx/conf.d/default.conf << SSLCONF
server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location /api/ {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 100M;
    }

    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}

server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}
SSLCONF

        print_success "Сертификат Let's Encrypt получен"
    fi
}

# Create .env file
create_env() {
    print_header "Создание конфигурации"

    cat > .env << ENVFILE
# FileShare Environment Configuration
# Generated by install.sh on $(date)
# Images from Docker Hub: $DOCKER_USER
# GitHub: https://github.com/$GITHUB_REPO

# Version
VERSION=$VERSION

# Database
DB_NAME=fileshare
DB_USER=fileshare
DB_PASSWORD=$DB_PASSWORD

# JWT
JWT_SECRET=$JWT_SECRET

# Session
SESSION_EXPIRY_DAYS=7
SESSION_COOKIE_NAME=fs_sid
COOKIE_SECRET=$COOKIE_SECRET

# Admin
ADMIN_SECRET_PATH=$ADMIN_SECRET_PATH

# CORS
CORS_ORIGIN=https://$DOMAIN

# SSL
SSL_TYPE=$SSL_TYPE
DOMAIN=$DOMAIN

# Docker Hub images
FRONTEND_IMAGE=$FRONTEND_IMAGE
BACKEND_IMAGE=$BACKEND_IMAGE
ENVFILE

    print_success "Файл .env создан"
}

# Create docker-compose file with Docker Hub images
create_compose() {
    print_header "Создание docker-compose.yml"

    cat > docker-compose.yml << COMPOSEFILE
services:
  # PostgreSQL Database
  db:
    image: postgres:16-alpine
    container_name: fileshare-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: \${DB_NAME:-fileshare}
      POSTGRES_USER: \${DB_USER:-fileshare}
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    volumes:
      - $DATASTORE_PATH/postgres:/var/lib/postgresql/data
    networks:
      - fileshare-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER:-fileshare}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API (from Docker Hub)
  backend:
    image: \${BACKEND_IMAGE:-$BACKEND_IMAGE}:\${VERSION:-latest}
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
      - $DATASTORE_PATH/uploads:/app/uploads
    depends_on:
      db:
        condition: service_healthy
    networks:
      - fileshare-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend (from Docker Hub)
  frontend:
    image: \${FRONTEND_IMAGE:-$FRONTEND_IMAGE}:\${VERSION:-latest}
    container_name: fileshare-frontend
    restart: unless-stopped
    networks:
      - fileshare-network
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  # Nginx (reverse proxy + SSL)
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
      - ./docker/nginx/certbot:/var/www/certbot:ro
    depends_on:
      - frontend
      - backend
    networks:
      - fileshare-network

networks:
  fileshare-network:
    driver: bridge
COMPOSEFILE

    print_success "docker-compose.yml создан"
}

# Create nginx configs
create_nginx_configs() {
    print_header "Создание конфигурации Nginx"

    mkdir -p docker/nginx/conf.d
    mkdir -p docker/nginx/certbot

    # Main nginx.conf
    cat > docker/nginx/nginx.conf << 'NGINXCONF'
worker_processes auto;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent"';
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    client_max_body_size 100M;
    server_tokens off;

    include /etc/nginx/conf.d/*.conf;
}
NGINXCONF

    # Default config (HTTP only, will be replaced if SSL is configured)
    cat > docker/nginx/conf.d/default.conf << 'DEFAULTCONF'
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location /api/ {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 100M;
    }

    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
DEFAULTCONF

    print_success "Конфигурация Nginx создана"
}

# Pull images from Docker Hub
pull_images() {
    print_header "Загрузка образов из Docker Hub"

    print_info "Загрузка frontend: $FRONTEND_IMAGE:$VERSION"
    docker pull "$FRONTEND_IMAGE:$VERSION"
    print_success "Frontend загружен"

    print_info "Загрузка backend: $BACKEND_IMAGE:$VERSION"
    docker pull "$BACKEND_IMAGE:$VERSION"
    print_success "Backend загружен"

    print_info "Загрузка postgres:16-alpine"
    docker pull postgres:16-alpine
    print_success "PostgreSQL загружен"

    print_info "Загрузка nginx:alpine"
    docker pull nginx:alpine
    print_success "Nginx загружен"

    echo ""
}

# Start services
start_services() {
    print_header "Запуск сервисов"

    print_info "Запуск контейнеров..."
    $COMPOSE_CMD up -d

    print_info "Ожидание запуска сервисов..."
    sleep 10

    # Check health
    if curl -sf http://localhost/api/health >/dev/null 2>&1; then
        print_success "Сервисы запущены и работают!"
    else
        print_warning "Сервисы запускаются, подождите немного..."
        print_info "Проверьте статус: cd $INSTALL_DIR && $COMPOSE_CMD ps"
    fi
}

# Print final info
print_final_info() {
    print_header "Установка завершена!"

    printf "${GREEN}═══════════════════════════════════════════════════════════════${NC}\n"
    echo ""
    printf "  ${BLUE}FileShare успешно установлен из Docker Hub!${NC}\n"
    echo ""
    printf "  ${YELLOW}Образы:${NC}\n"
    echo "  Frontend: $FRONTEND_IMAGE:$VERSION"
    echo "  Backend:  $BACKEND_IMAGE:$VERSION"
    echo ""
    printf "  ${YELLOW}Адрес сервиса:${NC}\n"
    echo "  https://$DOMAIN"
    echo ""
    printf "  ${YELLOW}Панель администратора:${NC}\n"
    echo "  https://$DOMAIN$ADMIN_SECRET_PATH"
    echo ""
    printf "  ${YELLOW}Первый вход в админку:${NC}\n"
    echo "  Перейдите по секретному URL и создайте логин/пароль"
    echo ""
    if [ "$SSL_TYPE" = "self-signed" ]; then
        printf "  ${YELLOW}⚠ Важно:${NC}\n"
        echo "  Используется самоподписанный сертификат."
        echo "  Добавьте его в доверенные или примите предупреждение браузера."
        echo ""
    fi
    printf "  ${YELLOW}Директория установки:${NC}\n"
    echo "  $INSTALL_DIR"
    echo ""
    printf "  ${YELLOW}Полезные команды:${NC}\n"
    echo "  cd $INSTALL_DIR"
    echo "  $COMPOSE_CMD logs -f        # Логи"
    echo "  $COMPOSE_CMD restart        # Перезапуск"
    echo "  $COMPOSE_CMD down           # Остановка"
    echo "  $COMPOSE_CMD ps             # Статус контейнеров"
    echo ""
    printf "  ${YELLOW}Обновление до новой версии:${NC}\n"
    echo "  Измените VERSION в .env и выполните:"
    echo "  cd $INSTALL_DIR && $COMPOSE_CMD pull && $COMPOSE_CMD up -d"
    echo ""
    printf "  ${YELLOW}Исходный код:${NC}\n"
    echo "  https://github.com/$GITHUB_REPO"
    echo ""
    printf "${GREEN}═══════════════════════════════════════════════════════════════${NC}\n"
}

# =============================================================================
# Main
# =============================================================================

main() {
    echo ""
    printf "${BLUE}"
    echo "  ███████╗ ██╗ ██╗      ███████╗ ██████╗██╗  ██╗ █████╗ ██╗  ██╗███████╗"
    echo "  ██╔════╝ ██║ ██║      ██╔════╝██╔════╝██║  ██║██╔══██╗██║  ██║██╔════╝"
    echo "  █████╗   ██║ ██║      █████╗  ██║     ███████║███████║███████║█████╗  "
    echo "  ██╔══╝   ██║ ██║      ██╔══╝  ██║     ██╔══██║██╔══██║██╔══██║██╔══╝  "
    echo "  ██║     █████╗███████╗███████╗╚██████╗██║  ██║██║  ██║██║  ██║███████╗"
    echo "  ╚═╝     ╚═══╝╚══════╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝"
    echo ""
    printf "  ${NC}Сервис обмена файлами и текстом\n"
    printf "  ${BLUE}Установка из Docker Hub: $DOCKER_USER${NC}\n"
    printf "  ${BLUE}GitHub: https://github.com/$GITHUB_REPO${NC}\n"
    echo ""

    check_requirements
    collect_config
    create_install_dir
    create_datastore
    create_nginx_configs
    create_compose
    create_env
    pull_images
    setup_ssl
    start_services
    print_final_info
}

# Run
main "$@"
