#!/bin/sh

# =============================================================================
# FileShare — Uninstallation Script
# =============================================================================
# Удаляет FileShare контейнеры и опционально данные
# POSIX-совместимый (работает с sh, bash, dash)
# =============================================================================

set -e

# Data storage
DATASTORE_PATH="/datastore"

# Colors
RED=''
GREEN=''
YELLOW=''
BLUE=''
NC=''

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

# Check Docker
check_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker не установлен!"
        exit 1
    fi

    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon не запущен!"
        exit 1
    fi
}

# Stop and remove containers
remove_containers() {
    print_header "Удаление контейнеров"

    # Stop containers
    print_info "Остановка контейнеров..."
    docker compose down 2>/dev/null || true

    # Remove containers by name
    for container in fileshare-nginx fileshare-frontend fileshare-backend fileshare-db; do
        if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
            print_info "Удаление контейнера: $container"
            docker rm -f "$container" 2>/dev/null || true
        fi
    done

    # Remove networks
    print_info "Удаление сетей..."
    docker network rm fileshare_fileshare-network 2>/dev/null || true

    print_success "Контейнеры удалены"
}

# Remove Docker images
remove_images() {
    print_header "Удаление Docker образов"

    printf "${YELLOW}Удалить Docker образы FileShare? [y/N]:${NC}\n"
    printf "> "
    read -r REMOVE_IMAGES
    REMOVE_IMAGES=${REMOVE_IMAGES:-N}

    case "$REMOVE_IMAGES" in
        [Yy]*)
            print_info "Удаление образов..."
            
            # Remove FileShare images
            docker images --format '{{.Repository}}:{{.Tag}}' | grep -E 'fileshare-(frontend|backend)' | while read -r image; do
                print_info "Удаление: $image"
                docker rmi "$image" 2>/dev/null || true
            done

            print_success "Образы удалены"
            ;;
        *)
            print_info "Образы сохранены"
            ;;
    esac
}

# Remove datastore
remove_datastore() {
    print_header "Удаление хранилища данных"

    if [ -d "$DATASTORE_PATH" ]; then
        printf "${YELLOW}Удалить директорию %s со всеми данными? [Y/n]:${NC}\n" "$DATASTORE_PATH"
        printf "  ${RED}ВНИМАНИЕ: Все загруженные файлы и база данных будут удалены!${NC}\n"
        printf "> "
        read -r REMOVE_DATA
        
        # По умолчанию удаляем (Enter = Yes)
        REMOVE_DATA=${REMOVE_DATA:-Y}

        case "$REMOVE_DATA" in
            [Nn]*)
                print_info "Директория $DATASTORE_PATH сохранена"
                ;;
            *)
                print_info "Удаление $DATASTORE_PATH..."
                rm -rf "$DATASTORE_PATH"
                print_success "Директория $DATASTORE_PATH удалена"
                ;;
        esac
    else
        print_info "Директория $DATASTORE_PATH не существует"
    fi
}

# Remove installation files
remove_install_files() {
    print_header "Удаление файлов установки"

    printf "${YELLOW}Удалить файлы установки (docker-compose.yml, .env, certs/)? [y/N]:${NC}\n"
    printf "> "
    read -r REMOVE_FILES
    REMOVE_FILES=${REMOVE_FILES:-N}

    case "$REMOVE_FILES" in
        [Yy]*)
            print_info "Удаление файлов..."
            
            rm -f docker-compose.yml
            rm -f .env
            rm -rf certs/
            rm -rf docker/nginx/conf.d/
            
            print_success "Файлы установки удалены"
            ;;
        *)
            print_info "Файлы установки сохранены"
            ;;
    esac
}

# Print summary
print_summary() {
    print_header "Удаление завершено!"

    printf "${GREEN}═══════════════════════════════════════════════════════════════${NC}\n"
    echo ""
    printf "  ${BLUE}FileShare успешно удалён!${NC}\n"
    echo ""
    printf "  ${YELLOW}Что было удалено:${NC}\n"
    echo "  ✓ Docker контейнеры"
    echo "  ✓ Docker сети"
    echo ""
    printf "  ${YELLOW}Для полного удаления проекта:${NC}\n"
    echo "  rm -rf $(pwd)"
    echo ""
    printf "${GREEN}═══════════════════════════════════════════════════════════════${NC}\n"
}

# =============================================================================
# Main
# =============================================================================

main() {
    echo ""
    printf "${RED}"
    echo "  ██████╗ ██╗   ██╗██╗██╗     ██╗      ██████╗ ██████╗ ███╗   ██╗███████╗██╗"
    echo "  ██╔══██╗██║   ██║██║██║     ██║     ██╔════╝██╔═══██╗████╗  ██║██╔════╝██║"
    echo "  ██████╔╝██║   ██║██║██║     ██║     ██║     ██║   ██║██╔██╗ ██║█████╗  ██║"
    echo "  ██╔═══╝ ██║   ██║██║██║     ██║     ██║     ██║   ██║██║╚██╗██║██╔══╝  ╚═╝"
    echo "  ██║     ╚██████╔╝██║███████╗███████╗╚██████╗╚██████╔╝██║ ╚████║███████╗██╗"
    echo "  ╚═╝      ╚═════╝ ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝"
    echo ""
    printf "  ${NC}Удаление FileShare\n"
    echo ""

    printf "${YELLOW}Вы уверены, что хотите удалить FileShare? [y/N]:${NC}\n"
    printf "> "
    read -r CONFIRM
    CONFIRM=${CONFIRM:-N}

    case "$CONFIRM" in
        [Yy]*)
            check_docker
            remove_containers
            remove_images
            remove_datastore
            remove_install_files
            print_summary
            ;;
        *)
            print_info "Удаление отменено"
            exit 0
            ;;
    esac
}

# Run
main "$@"
