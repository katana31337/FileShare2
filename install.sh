#!/bin/bash

# =============================================================================
# FileShare — Installation Script
# =============================================================================
# This script installs and configures the FileShare service using Docker.
# It supports both self-signed certificates and Let's Encrypt.
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check prerequisites
check_requirements() {
    print_header "Проверка требований"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker не установлен!"
        echo "Установите Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker установлен: $(docker --version)"

    # Check Docker Compose
    if ! command -v docker compose &> /dev/null; then
        if ! command -v docker-compose &> /dev/null; then
            print_error "Docker Compose не установлен!"
            echo "Установите Docker Compose: https://docs.docker.com/compose/install/"
            exit 1
        fi
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    print_success "Docker Compose доступен"

    # Check Docker daemon
    if ! docker info &> /dev/null; then
        print_error "Docker daemon не запущен!"
        echo "Запустите Docker и попробуйте снова."
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

    # Domain
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
        
        # Email for Let's Encrypt
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
    echo -e "${YELLOW}Пароль для базы данных (или нажмите Enter для автогенерации):${NC}"
    read -p "> " DB_PASSWORD_INPUT
    if [ -z "$DB_PASSWORD_INPUT" ]; then
        DB_PASSWORD=$(generate_password 24)
        print_info "Сгенерирован пароль для БД"
    else
        DB_PASSWORD="$DB_PASSWORD_INPUT"
    fi

    # JWT Secret
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
        print_warning "Браузер будет предупреждать о недоверенном сертификате — это нормально для локальной установки"

    elif [ "$SSL_TYPE" = "letsencrypt" ]; then
        print_info "Получение сертификата Let's Encrypt..."
        
        # Create temporary nginx config for ACME challenge
        mkdir -p docker/nginx/certbot
        
        cat > docker/nginx/conf.d/default.conf << 'LECONF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
LECONF
        sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" docker/nginx/conf.d/default.conf

        # Start nginx temporarily
        $COMPOSE_CMD up -d nginx
        
        # Wait for nginx
        sleep 5

        # Request certificate
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

        # Stop temporary nginx
        $COMPOSE_CMD stop nginx

        # Create proper SSL config
        cat > docker/nginx/conf.d/default.conf << SSLCONF
server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

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
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
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
ENVFILE

    print_success "Файл .env создан"
}

# Build and start containers
start_services() {
    print_header "Запуск сервисов"

    print_info "Сборка Docker образов..."
    $COMPOSE_CMD build --no-cache

    print_info "Запуск контейнеров..."
    $COMPOSE_CMD up -d

    # Wait for services to be ready
    print_info "Ожидание запуска сервисов..."
    sleep 10

    # Check health
    if curl -sf http://localhost/api/health > /dev/null 2>&1; then
        print_success "Сервисы запущены и работают!"
    else
        print_warning "Сервисы запускаются, подождите немного..."
    fi
}

# Print final info
print_final_info() {
    print_header "Установка завершена!"

    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${BLUE}FileShare успешно установлен!${NC}"
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
        echo -e "  Для добавления в доверенные (Linux):"
        echo -e "  sudo cp certs/cert.pem /usr/local/share/ca-certificates/fileshare.crt"
        echo -e "  sudo update-ca-certificates"
        echo ""
    fi
    echo -e "  ${YELLOW}Полезные команды:${NC}"
    echo -e "  $COMPOSE_CMD logs -f        # Логи"
    echo -e "  $COMPOSE_CMD restart        # Перезапуск"
    echo -e "  $COMPOSE_CMD down           # Остановка"
    echo -e "  $COMPOSE_CMD ps             # Статус контейнеров"
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
    echo ""

    check_requirements
    collect_config
    create_env
    setup_ssl
    start_services
    print_final_info
}

# Run
main "$@"
