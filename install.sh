#!/bin/bash

# =============================================================================
# FileShare — Installation Script
# =============================================================================
# Устанавливает FileShare из Docker Hub (katana31337)
# =============================================================================

set -e

# Docker Hub
DOCKER_USER="katana31337"
FRONTEND_IMAGE="$DOCKER_USER/fileshare-frontend"
BACKEND_IMAGE="$DOCKER_USER/fileshare-backend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error()   { echo -e "${RED}✗ $1${NC}"; }
print_info()    { echo -e "${BLUE}ℹ $1${NC}"; }

# Check prerequisites
check_requirements() {
    print_header "Проверка требований"

    if ! command -v docker &> /dev/null; then
        print_error "Docker не установлен!"
        echo "Установите Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker установлен: $(docker --version)"

    if ! docker info &> /dev/null; then
        print_error "Docker daemon не запущен!"
        exit 1
    fi
    print_success "Docker daemon запущен"

    echo ""
}

# Generate random password
generate_password() {
    local length=${1:-32}
    openssl rand -base64 48 | tr -dc 'a-zA-Z0-9!@#$%^&*' | head -c "$length"
}

# Generate random string
generate_random_string() {
    local length=${1:-32}
    openssl rand -hex "$length"
}

# Collect configuration
collect_config() {
    print_header "Конфигурация проекта"

    # Version
    echo -e "${YELLOW}Введите версию FileShare для установки (или Enter для latest):${NC}"
    read -p "> " VERSION_INPUT
    VERSION=${VERSION_INPUT:-latest}
    print_info "Версия: $VERSION"

    # Domain
    echo ""
    echo -e "${YELLOW}Введите домен для сервиса:${NC}"
    echo -e "  (например: fileshare.local, files.example.com)"
    read -p "> " DOMAIN
    DOMAIN=${DOMAIN:-fileshare.local}
    print_info "Домен: $DOMAIN"

    # SSL Type
    echo ""
    echo -e "${YELLOW}Выберите тип SSL сертификата:${NC}"
    echo "  1) Самоподписанный сертификат (для локальной разработки)"
    echo "  2) Let's Encrypt (для публичного домена)"
    echo ""
    read -p "Выберите [1/2] (по умолчанию: 1): " SSL_CHOICE
    SSL_CHOICE=${SSL_CHOICE:-1}

    if [ "$SSL_CHOICE" = "2" ]; then
        SSL_TYPE="letsencrypt"
        print_info "Тип: Let's Encrypt"
        
        echo ""
        echo -e "${YELLOW}Введите email для Let's Encrypt:${NC}"
        read -p "> " LETSENCRYPT_EMAIL
        if [ -z "$LETSENCRYPT_EMAIL" ]; then
            print_error "Email обязателен для Let's Encrypt!"
            exit 1
        fi
    else
        SSL_TYPE="self-signed"
        print_info "Тип: Самоподписанный сертификат"
    fi

    # Admin secret path
    echo ""
    echo -e "${YELLOW}Создайте секретный URL для доступа к админке:${NC}"
    echo -e "  (Например: my-secret-admin-xyz123)"
    echo -e "  ${BLUE}Этот URL нужно будет ввести в браузере для входа в админку${NC}"
    read -p "> " ADMIN_PATH
    ADMIN_PATH=${ADMIN_PATH:-$(generate_random_string 16)}
    ADMIN_SECRET_PATH="/${ADMIN_PATH}"
    print_info "Секретный URL: $ADMIN_SECRET_PATH"

    # Database password
    echo ""
    echo -e "${YELLOW}Пароль для базы данных (или Enter для автогенерации):${NC}"
    read -p "> " DB_PASSWORD_INPUT
    if [ -z "$DB_PASSWORD_INPUT" ]; then
        DB_PASSWORD=$(generate_password 24)
        print_info "Сгенерирован пароль для БД"
    else
        DB_PASSWORD="$DB_PASSWORD_INPUT"
    fi

    # Generate secrets
    JWT_SECRET=$(generate_random_string 32)
    COOKIE_SECRET=$(generate_random_string 32)

    echo ""
    print_success "Конфигурация собрана!"
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
        docker compose up -d nginx
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

        docker compose stop nginx

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
version: '3.8'

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
      - postgres_/var/lib/postgresql/data
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
      - uploads_/app/uploads
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

volumes:
  postgres_
    driver: local
  uploads_
    driver: local

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
    docker compose up -d

    print_info "Ожидание запуска сервисов..."
    sleep 10

    # Check health
    if curl -sf http://localhost/api/health > /dev/null 2>&1; then
        print_success "Сервисы запущены и работают!"
    else
        print_warning "Сервисы запускаются, подождите немного..."
        print_info "Проверьте статус: docker compose ps"
    fi
}

# Print final info
print_final_info() {
    print_header "Установка завершена!"

    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${BLUE}FileShare успешно установлен из Docker Hub!${NC}"
    echo ""
    echo -e "  ${YELLOW}Образы:${NC}"
    echo -e "  Frontend: $FRONTEND_IMAGE:$VERSION"
    echo -e "  Backend:  $BACKEND_IMAGE:$VERSION"
    echo ""
    echo -e "  ${YELLOW}Адрес сервиса:${NC}"
    if [ "$SSL_TYPE" = "self-signed" ]; then
        echo -e "  https://$DOMAIN"
    else
        echo -e "  https://$DOMAIN"
    fi
    echo ""
    echo -e "  ${YELLOW}Панель администратора:${NC}"
    echo -e "  https://$DOMAIN$ADMIN_SECRET_PATH"
    echo ""
    echo -e "  ${YELLOW}Первый вход в админку:${NC}"
    echo -e "  Перейдите по секретному URL и создайте логин/пароль"
    echo ""
    if [ "$SSL_TYPE" = "self-signed" ]; then
        echo -e "  ${YELLOW}⚠ Важно:${NC}"
        echo -e "  Используется самоподписанный сертификат."
        echo -e "  Добавьте его в доверенные или примите предупреждение браузера."
        echo ""
    fi
    echo -e "  ${YELLOW}Полезные команды:${NC}"
    echo -e "  docker compose logs -f        # Логи"
    echo -e "  docker compose restart        # Перезапуск"
    echo -e "  docker compose down           # Остановка"
    echo -e "  docker compose ps             # Статус контейнеров"
    echo ""
    echo -e "  ${YELLOW}Обновление до новой версии:${NC}"
    echo -e "  Измените VERSION в .env и выполните:"
    echo -e "  docker compose pull && docker compose up -d"
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
}

# =============================================================================
# Main
# =============================================================================

main() {
    echo ""
    echo -e "${BLUE}"
    echo "  ███████╗ ██╗ ██╗      ███████╗ ██████╗██╗  ██╗ █████╗ ██╗  ██╗███████╗"
    echo "  ██╔════╝ ██║ ██║      ██╔════╝██╔════╝██║  ██║██╔══██╗██║  ██║██╔════╝"
    echo "  █████╗   ██║ ██║      █████╗  ██║     ███████║███████║███████║█████╗  "
    echo "  ██╔══╝   ██║ ██║      ██╔══╝  ██║     ██╔══██║██╔══██║██╔══██║██╔══╝  "
    echo "  ██║     █████╗███████╗███████╗╚██████╗██║  ██║██║  ██║██║  ██║███████╗"
    echo "  ╚═╝     ╚═══╝╚══════╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝"
    echo ""
    echo -e "  ${NC}Сервис обмена файлами и текстом"
    echo -e "  ${BLUE}Установка из Docker Hub: $DOCKER_USER${NC}"
    echo ""

    check_requirements
    collect_config
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
