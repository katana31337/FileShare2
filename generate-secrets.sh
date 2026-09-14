#!/bin/bash

# =============================================================================
# FileShare — Generate Secrets
# =============================================================================
# Генерирует безопасные секреты для .env файла
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Генератор секретов для FileShare${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Generate secrets
DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9!@#$%^&*' | head -c 24)
JWT_SECRET=$(openssl rand -hex 32)
COOKIE_SECRET=$(openssl rand -hex 32)
ADMIN_PATH=$(openssl rand -hex 16)

echo -e "${YELLOW}Сгенерированные секреты:${NC}"
echo ""
echo -e "${GREEN}DB_PASSWORD:${NC}"
echo "  $DB_PASSWORD"
echo ""
echo -e "${GREEN}JWT_SECRET:${NC}"
echo "  $JWT_SECRET"
echo ""
echo -e "${GREEN}COOKIE_SECRET:${NC}"
echo "  $COOKIE_SECRET"
echo ""
echo -e "${GREEN}ADMIN_SECRET_PATH:${NC}"
echo "  /$ADMIN_PATH"
echo ""

# Ask to create .env file
echo -e "${YELLOW}Создать .env файл с этими секретами? [Y/n]:${NC}"
read -p "> " CREATE_ENV
CREATE_ENV=${CREATE_ENV:-Y}

if [[ "$CREATE_ENV" =~ ^[Yy]$ ]]; then
    # Check if .env exists
    if [ -f .env ]; then
        echo -e "${YELLOW}.env файл уже существует. Перезаписать? [y/N]:${NC}"
        read -p "> " OVERWRITE
        if [[ ! "$OVERWRITE" =~ ^[Yy]$ ]]; then
            echo "Отменено"
            exit 0
        fi
    fi

    cat > .env << ENVFILE
# FileShare Environment Configuration
# Generated on $(date)

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
ADMIN_SECRET_PATH=/$ADMIN_PATH

# CORS
CORS_ORIGIN=https://localhost

# SSL
SSL_TYPE=self-signed
DOMAIN=localhost
ENVFILE

    echo ""
    echo -e "${GREEN}✓ Файл .env создан!${NC}"
    echo ""
    echo -e "${YELLOW}Важно:${NC}"
    echo "  - Сохраните эти секреты в безопасном месте"
    echo "  - Измените CORS_ORIGIN на ваш домен"
    echo "  - Секретный URL админки: /$ADMIN_PATH"
    echo ""
fi

# Print for manual copy
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Для копирования вручную:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "DB_PASSWORD=$DB_PASSWORD"
echo "JWT_SECRET=$JWT_SECRET"
echo "COOKIE_SECRET=$COOKIE_SECRET"
echo "ADMIN_SECRET_PATH=/$ADMIN_PATH"
echo ""
