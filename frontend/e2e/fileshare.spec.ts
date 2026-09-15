import { test, expect } from '@playwright/test';

const ADMIN_SECRET_PATH = process.env.ADMIN_SECRET_PATH || '/test-admin-secret';

test.describe('FileShare E2E Tests', () => {
  test.describe('Home Page', () => {
    test('should load home page', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('h1')).toContainText('Обмен файлами');
    });

    test('should have upload area', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('text=Перетащите файл')).toBeVisible();
      await expect(page.locator('text=Выбрать файл')).toBeVisible();
    });

    test('should navigate to history page', async ({ page }) => {
      await page.goto('/');
      await page.click('text=История');
      await expect(page).toHaveURL(/.*#\/history/);
    });

    test('should navigate to text share page', async ({ page }) => {
      await page.goto('/');
      await page.click('text=Текст');
      await expect(page).toHaveURL(/.*#\/text-share/);
    });
  });

  test.describe('File Upload', () => {
    test('should upload a file', async ({ page }) => {
      await page.goto('/');
      
      // Create a test file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('test content'),
      });

      // Wait for upload to complete
      await expect(page.locator('text=Файл загружен')).toBeVisible({ timeout: 10000 });
    });

    test('should show download link after upload', async ({ page }) => {
      await page.goto('/');
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('test content'),
      });

      await expect(page.locator('text=Ссылка для скачивания')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Text Sharing', () => {
    test('should create shared text', async ({ page }) => {
      await page.goto('/#/text-share');
      
      await page.fill('textarea', 'This is a test text');
      await page.click('text=Создать ссылку');
      
      await expect(page.locator('text=Текст опубликован')).toBeVisible({ timeout: 10000 });
    });

    test('should show share link', async ({ page }) => {
      await page.goto('/#/text-share');
      
      await page.fill('textarea', 'Test content');
      await page.click('text=Создать ссылку');
      
      await expect(page.locator('text=Ссылка для доступа')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('History Page', () => {
    test('should show empty state initially', async ({ page }) => {
      await page.goto('/#/history');
      await expect(page.locator('text=Нет загруженных файлов')).toBeVisible();
    });

    test('should show uploaded files', async ({ page }) => {
      // Upload a file first
      await page.goto('/');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'history-test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('test content'),
      });
      
      await expect(page.locator('text=Файл загружен')).toBeVisible({ timeout: 10000 });
      
      // Navigate to history
      await page.click('text=История');
      await expect(page.locator('text=history-test.txt')).toBeVisible();
    });
  });

  test.describe('Admin Panel', () => {
    test('should show setup form on first visit', async ({ page }) => {
      await page.goto(`/#${ADMIN_SECRET_PATH}`);
      await expect(page.locator('text=Создание администратора')).toBeVisible();
    });

    test('should create admin', async ({ page }) => {
      await page.goto(`/#${ADMIN_SECRET_PATH}`);
      
      // Fill form with strong password
      await page.fill('input[placeholder*="3 символа"]', 'testadmin');
      await page.fill('input[placeholder*="12 символов"]', 'StrongPassword123!');
      await page.fill('input[placeholder*="Повторите"]', 'StrongPassword123!');
      
      // Wait for button to be enabled
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeEnabled({ timeout: 5000 });
      
      // Click and wait for success message or page change
      await submitButton.click();
      
      // Wait for either success message or redirect
      await page.waitForTimeout(2000);
      
      // Check if admin was created by checking localStorage
      const hasCredentials = await page.evaluate(() => {
        return localStorage.getItem('admin_credentials') !== null;
      });
      expect(hasCredentials).toBe(true);
    });

    test('should show login form on subsequent visits', async ({ page }) => {
      // First create admin
      await page.goto(`/#${ADMIN_SECRET_PATH}`);
      await page.fill('input[placeholder*="3 символа"]', 'testadmin');
      await page.fill('input[placeholder*="12 символов"]', 'StrongPassword123!');
      await page.fill('input[placeholder*="Повторите"]', 'StrongPassword123!');
      
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeEnabled({ timeout: 5000 });
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      // Clear session and visit again
      await page.evaluate(() => localStorage.removeItem('admin_session'));
      await page.goto(`/#${ADMIN_SECRET_PATH}`);
      
      await expect(page.locator('text=Вход в панель')).toBeVisible();
    });

    test('should login with correct credentials', async ({ page }) => {
      // Setup admin first
      await page.goto(`/#${ADMIN_SECRET_PATH}`);
      await page.fill('input[placeholder*="3 символа"]', 'testadmin');
      await page.fill('input[placeholder*="12 символов"]', 'StrongPassword123!');
      await page.fill('input[placeholder*="Повторите"]', 'StrongPassword123!');
      
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeEnabled({ timeout: 5000 });
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      // Logout
      await page.evaluate(() => {
        localStorage.removeItem('admin_session');
      });
      
      // Login
      await page.goto(`/#${ADMIN_SECRET_PATH}`);
      await page.fill('input[placeholder*="логин"]', 'testadmin');
      await page.fill('input[placeholder*="пароль"]', 'StrongPassword123!');
      await page.click('button:has-text("Войти")');
      
      await expect(page.locator('text=Панель администратора')).toBeVisible({ timeout: 10000 });
    });

    test('should reject wrong password', async ({ page }) => {
      // Setup admin first
      await page.goto(`/#${ADMIN_SECRET_PATH}`);
      await page.fill('input[placeholder*="3 символа"]', 'testadmin');
      await page.fill('input[placeholder*="12 символов"]', 'StrongPassword123!');
      await page.fill('input[placeholder*="Повторите"]', 'StrongPassword123!');
      
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeEnabled({ timeout: 5000 });
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      // Clear and try wrong password
      await page.evaluate(() => {
        localStorage.removeItem('admin_session');
      });
      
      await page.goto(`/#${ADMIN_SECRET_PATH}`);
      await page.fill('input[placeholder*="логин"]', 'testadmin');
      await page.fill('input[placeholder*="пароль"]', 'WrongPassword123!');
      await page.click('button:has-text("Войти")');
      
      await expect(page.locator('text=Неверный логин или пароль')).toBeVisible();
    });

    test('should not be accessible without secret path', async ({ page }) => {
      await page.goto('/#/admin');
      // Should show 404 or redirect to home
      await expect(page.locator('text=Панель администратора')).not.toBeVisible();
    });
  });

  test.describe('API Health Check', () => {
    test('API should be healthy', async ({ request }) => {
      const response = await request.get('/api/health');
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.status).toBe('ok');
    });
  });
});
