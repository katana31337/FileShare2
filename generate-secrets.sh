#!/bin/sh

# =============================================================================
# FileShare — Generate Secrets
# =============================================================================
# Генерирует безопасные секреты для .env файла
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

echo ""
printf "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
printf "${BLUE}  Генератор секретов для FileShare${NC}\n"
printf "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
echo ""

# Generate secrets
DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9!@#$%^&*' | head -c 24)
JWT_SECRET=$(openssl rand -hex 32)
COOKIE_SECRET=$(openssl rand -hex 32)
ADMIN_PATH=$(openssl rand -hex 16)

printf "${YELLOW}Сгенерированные секреты:${NC}\n"
echo ""
printf "${GREEN}DB_PASSWORD:${NC}\n"
echo "  $DB_PASSWORD"
echo ""
printf "${GREEN}JWT_SECRET:${NC}\n"
echo "  $JWT_SECRET"
echo ""
printf "${GREEN}COOKIE_SECRET:${NC}\n"
echo "  $COOKIE_SECRET"
echo ""
printf "${GREEN}ADMIN_SECRET_PATH:${NC}\n"
echo "  /$ADMIN_PATH"
echo ""

# Ask to create .env file
printf "${YELLOW}Создать .env файл с этими секретами? [Y/n]:${NC}\n"
printf "> "
read -r CREATE_ENV
CREATE_ENV=${CREATE_ENV:-Y}

case "$CREATE_ENV" in
    [Yy]*)
        # Check if .env exists
        if [ -f .env ]; then
            printf "${YELLOW}.env файл уже существует. Перезаписать? [y/N]:${NC}\n"
            printf "> "
            read -r OVERWRITE
            case "$OVERWRITE" in
                [Yy]*) ;;
                *)
                    echo "Отменено"
                    exit 0
                    ;;
            esac
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
        printf "${GREEN}✓ Файл .env создан!${NC}\n"
        echo ""
        printf "${YELLOW}Важно:${NC}\n"
        echo "  - Сохраните эти секреты в безопасном месте"
        echo "  - Измените CORS_ORIGIN на ваш домен"
        echo "  - Секретный URL админки: /$ADMIN_PATH"
        echo ""
        ;;
    *)
        echo "Пропущено создание .env файла"
        ;;
esac

# Print for manual copy
printf "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
printf "${BLUE}  Для копирования вручную:${NC}\n"
printf "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
echo ""
echo "DB_PASSWORD=$DB_PASSWORD"
echo "JWT_SECRET=$JWT_SECRET"
echo "COOKIE_SECRET=$COOKIE_SECRET"
echo "ADMIN_SECRET_PATH=/$ADMIN_PATH"
echo ""
