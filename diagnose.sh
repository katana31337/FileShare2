#!/bin/sh

# =============================================================================
# FileShare — Diagnostic Script
# =============================================================================
# Помогает диагностировать проблемы с запуском
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo ""
    printf "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
    printf "${BLUE}  %s${NC}\n" "$1"
    printf "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
    echo ""
}

print_info() { printf "${BLUE}ℹ %s${NC}\n" "$1"; }
print_success() { printf "${GREEN}✓ %s${NC}\n" "$1"; }
print_warning() { printf "${YELLOW}⚠ %s${NC}\n" "$1"; }
print_error() { printf "${RED}✗ %s${NC}\n" "$1"; }

print_header "Диагностика FileShare"

# 1. Проверка контейнеров
print_info "Статус контейнеров:"
docker ps -a --filter "name=fileshare" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""

# 2. Логи frontend
print_info "Последние логи frontend:"
docker logs fileshare-frontend --tail 20 2>&1 || print_error "Контейнер frontend не запущен"

echo ""

# 3. Логи backend
print_info "Последние логи backend:"
docker logs fileshare-backend --tail 20 2>&1 || print_error "Контейнер backend не запущен"

echo ""

# 4. Логи nginx
print_info "Последние логи nginx:"
docker logs fileshare-nginx --tail 20 2>&1 || print_error "Контейнер nginx не запущен"

echo ""

# 5. Проверка nginx конфига
print_info "Проверка конфигурации nginx:"
docker exec fileshare-nginx nginx -t 2>&1 || print_error "Ошибка в конфигурации nginx"

echo ""

# 6. Проверка /etc/hosts
print_info "Проверка /etc/hosts:"
if grep -q "fileshare.local" /etc/hosts; then
    print_success "fileshare.local найден в /etc/hosts"
    grep "fileshare.local" /etc/hosts
else
    print_warning "fileshare.local НЕ найден в /etc/hosts"
    print_info "Добавьте строку: 127.0.0.1 fileshare.local"
fi

echo ""

# 7. Проверка SSL сертификатов
print_info "Проверка SSL сертификатов:"
if [ -f "certs/cert.pem" ] && [ -f "certs/key.pem" ]; then
    print_success "SSL сертификаты найдены"
    ls -lh certs/
else
    print_warning "SSL сертификаты не найдены в certs/"
fi

echo ""

# 8. Проверка datastore
print_info "Проверка /datastore:"
if [ -d "/datastore" ]; then
    print_success "Директория /datastore существует"
    ls -lh /datastore/
else
    print_warning "Директория /datastore не существует"
fi

echo ""

# 9. Проверка сети
print_info "Проверка сети Docker:"
docker network ls --filter "name=fileshare"

echo ""

# 10. Тест подключения к backend из nginx
print_info "Тест подключения к backend из контейнера nginx:"
docker exec fileshare-nginx wget -qO- http://backend:3001/api/health 2>&1 || print_error "Не удалось подключиться к backend"

echo ""

# 11. Тест подключения к frontend из nginx
print_info "Тест подключения к frontend из контейнера nginx:"
docker exec fileshare-nginx wget -qO- http://frontend:80 2>&1 | head -5 || print_error "Не удалось подключиться к frontend"

print_header "Диагностика завершена"
