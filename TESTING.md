# FileShare — Тестирование

Полная система тестирования для FileShare проекта.

## 📋 Типы тестов

### 1. Unit Tests (Frontend)
Тестирование отдельных компонентов и утилит.

```bash
npm test              # Запустить тесты
npm run test:watch    # Watch mode
npm run test:coverage # С покрытием
```

**Что тестируется:**
- ✅ Auth utils (хеширование паролей)
- ✅ Store (Zustand)
- ✅ Компоненты (Header, HomePage, LoginPage, AdminSetupPage)
- ✅ Утилиты и хелперы

### 2. Unit Tests (Backend)
Тестирование API и сервисов.

```bash
cd backend
npm test              # Запустить тесты
npm run test:watch    # Watch mode
npm run test:coverage # С покрытием
```

**Что тестируется:**
- ✅ API endpoints
- ✅ Сервисы (File, Text, Admin, Session)
- ✅ Middleware
- ✅ Database queries

### 3. Integration Tests
Тестирование взаимодействия компонентов.

```bash
# Запустить через Docker Compose
docker compose up -d
npm run test:integration
```

**Что тестируется:**
- ✅ Полный цикл загрузки файла
- ✅ API → Database взаимодействие
- ✅ Session management
- ✅ File storage

### 4. E2E Tests (Playwright)
Сквозное тестирование пользовательских сценариев.

```bash
npm install -D @playwright/test
npx playwright install
npx playwright test
```

**Что тестируется:**
- ✅ Загрузка файлов через UI
- ✅ Создание общих текстов
- ✅ Навигация по страницам
- ✅ Авторизация в админке
- ✅ Полный пользовательский flow

## 🚀 GitHub Actions

Автоматические тесты при каждом push и pull request.

### Workflows

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Frontend tests
   - Backend tests
   - Docker build
   - Security scan
   - Integration tests

2. **E2E Tests** (`.github/workflows/e2e.yml`)
   - Playwright тесты
   - Скриншоты при ошибках
   - HTML отчёты

3. **Docker Build** (`.github/workflows/docker.yml`)
   - Сборка образов
   - Push в Docker Hub
   - Multi-arch поддержка

## 📊 Покрытие кода

### Frontend
```bash
npm run test:coverage
```

Отчёт генерируется в `coverage/`

### Backend
```bash
cd backend
npm run test:coverage
```

Отчёт генерируется в `backend/coverage/`

## 🔧 Настройка тестового окружения

### Переменные окружения для тестов

Создайте `.env.test`:

```env
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fileshare_test
DB_USER=fileshare
DB_PASSWORD=test_password
JWT_SECRET=test_secret
COOKIE_SECRET=test_cookie_secret
ADMIN_SECRET_PATH=/test-admin
DOMAIN=localhost
CORS_ORIGIN=http://localhost
```

### Тестовая база данных

```bash
# Создать тестовую БД
createdb fileshare_test

# Или через Docker
docker run -d \
  --name fileshare-test-db \
  -e POSTGRES_DB=fileshare_test \
  -e POSTGRES_USER=fileshare \
  -e POSTGRES_PASSWORD=test_password \
  -p 5432:5432 \
  postgres:16-alpine
```

## 📝 Написание тестов

### Frontend (Vitest + React Testing Library)

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Component from './Component';

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Backend (Jest + Supertest)

```typescript
import request from 'supertest';
import app from '../src/app';

describe('API', () => {
  it('GET /api/health should return 200', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
  });
});
```

### E2E (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('should upload file', async ({ page }) => {
  await page.goto('/');
  await page.setInputFiles('input[type="file"]', 'test.txt');
  await expect(page.locator('text=Загружено')).toBeVisible();
});
```

## 🎯 CI/CD Pipeline

### При push в ветку:
1. ✅ Линтинг
2. ✅ Unit тесты
3. ✅ Сборка
4. ✅ Docker build
5. ✅ Security scan

### При push в main:
1. ✅ Все предыдущие шаги
2. ✅ Integration tests
3. ✅ E2E tests
4. ✅ Deploy (если настроен)

### При создании тега (v*):
1. ✅ Все тесты
2. ✅ Docker push
3. ✅ Release notes

## 🔍 Отчёты и артефакты

### Локально:
- Coverage: `coverage/`
- Playwright: `playwright-report/`
- Screenshots: `test-results/`

### GitHub Actions:
- Артефакты сохраняются 7 дней
- Coverage загружается в Codecov
- Playwright отчёты в HTML

## 🐛 Отладка тестов

### Frontend
```bash
# Debug mode
npm run test:watch -- --inspect

# Один тест
npm test -- --grep "название теста"

# Показать браузер
npm run test:watch -- --headed
```

### Backend
```bash
# Debug mode
npm test -- --inspect

# Один тест
npm test -- -t "название теста"

# Verbose output
npm test -- --verbose
```

### E2E
```bash
# Debug mode
npx playwright test --debug

# Один тест
npx playwright test -g "название теста"

# Показать браузер
npx playwright test --headed

# Tracing
npx playwright test --trace on
```

## 📚 Полезные команды

```bash
# Все тесты
npm test                    # Frontend
cd backend && npm test      # Backend
npx playwright test         # E2E

# С покрытием
npm run test:coverage       # Frontend
cd backend && npm run test:coverage  # Backend

# Watch mode
npm run test:watch          # Frontend
cd backend && npm run test:watch     # Backend

# Линтинг
npm run lint                # Frontend
cd backend && npm run lint  # Backend

# Типизация
npm run typecheck           # Frontend
cd backend && npm run typecheck      # Backend
```

## 🎓 Best Practices

1. **Пишите тесты для нового кода** — покрытие должно расти
2. **Тестируйте поведение, не реализацию** — тесты не должны ломаться при рефакторинге
3. **Используйте моки осторожно** — только для внешних зависимостей
4. **Держите тесты быстрыми** — unit < 1s, integration < 10s, e2e < 60s
5. **Чистите тестовые данные** — каждый тест должен быть независимым
6. **Используйте fixtures** — переиспользуемые тестовые данные
7. **Пишите понятные имена** — что тестируется и какой результат ожидается

## 🔗 Ресурсы

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Library Best Practices](https://testing-library.com/docs/guides/)
