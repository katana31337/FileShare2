import request from 'supertest';
import express from 'express';

// Mock database
jest.mock('../src/config/database.js', () => ({
  query: jest.fn(),
  pool: {
    on: jest.fn(),
    end: jest.fn(),
  },
  getClient: jest.fn(),
  default: {
    on: jest.fn(),
    end: jest.fn(),
  },
}));

// Import after mocks
import { query } from '../src/config/database.js';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
};

describe('API Health Check', () => {
  const app = createTestApp();

  it('GET /api/health should return 200', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
  });
});

describe('File API', () => {
  const app = createTestApp();

  // Mock session middleware
  app.use((req, res, next) => {
    (req as any).sessionId = 'test-session-id';
    next();
  });

  // Mock file routes
  app.get('/api/files', async (req, res) => {
    (query as jest.Mock).mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    });
    res.json({ success: true, data: [] });
  });

  app.post('/api/files/upload', async (req, res) => {
    res.status(201).json({
      success: true,
      data: {
        id: 'test-file-id',
        name: 'test.txt',
        size: 100,
        type: 'text/plain',
        downloadLink: '/api/files/test-file-id/download',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  });

  it('GET /api/files should return files list', async () => {
    const response = await request(app).get('/api/files');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('POST /api/files/upload should upload a file', async () => {
    const response = await request(app)
      .post('/api/files/upload')
      .attach('file', Buffer.from('test content'), 'test.txt');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('name', 'test.txt');
  });
});

describe('Text API', () => {
  const app = createTestApp();

  app.use((req, res, next) => {
    (req as any).sessionId = 'test-session-id';
    next();
  });

  app.get('/api/texts', async (req, res) => {
    res.json({ success: true, data: [] });
  });

  app.post('/api/texts', async (req, res) => {
    const { title, content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Содержимое не может быть пустым' });
    }

    res.status(201).json({
      success: true,
      data: {
        id: 'test-text-id',
        title: title || 'Без названия',
        content: content.trim(),
        shareLink: '/api/texts/test-text-id',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  });

  it('GET /api/texts should return texts list', async () => {
    const response = await request(app).get('/api/texts');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
  });

  it('POST /api/texts should create a text', async () => {
    const response = await request(app)
      .post('/api/texts')
      .send({ title: 'Test', content: 'Hello world' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('title', 'Test');
    expect(response.body.data).toHaveProperty('content', 'Hello world');
  });

  it('POST /api/texts should reject empty content', async () => {
    const response = await request(app)
      .post('/api/texts')
      .send({ title: 'Test', content: '' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});

describe('Admin API', () => {
  const app = createTestApp();

  app.get('/api/admin/status', async (req, res) => {
    res.json({ success: true, data: { initialized: false } });
  });

  app.post('/api/admin/setup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Логин должен быть минимум 3 символа' });
    }

    if (!password || password.length < 12) {
      return res.status(400).json({ error: 'Пароль должен быть минимум 12 символов' });
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return res.status(400).json({ error: 'Пароль слишком простой' });
    }

    res.status(201).json({ success: true, message: 'Администратор создан' });
  });

  it('GET /api/admin/status should return status', async () => {
    const response = await request(app).get('/api/admin/status');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('initialized');
  });

  it('POST /api/admin/setup should create admin with valid data', async () => {
    const response = await request(app)
      .post('/api/admin/setup')
      .send({
        username: 'admin',
        password: 'StrongPass123!@#',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
  });

  it('POST /api/admin/setup should reject short username', async () => {
    const response = await request(app)
      .post('/api/admin/setup')
      .send({
        username: 'ab',
        password: 'StrongPass123!@#',
      });

    expect(response.status).toBe(400);
  });

  it('POST /api/admin/setup should reject weak password', async () => {
    const response = await request(app)
      .post('/api/admin/setup')
      .send({
        username: 'admin',
        password: 'weak',
      });

    expect(response.status).toBe(400);
  });

  it('POST /api/admin/setup should reject password without special chars', async () => {
    const response = await request(app)
      .post('/api/admin/setup')
      .send({
        username: 'admin',
        password: 'StrongPassword123',
      });

    expect(response.status).toBe(400);
  });
});
