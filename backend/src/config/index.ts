import dotenv from 'dotenv';
dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  upload: {
    maxFileSize: number; // bytes
    storagePath: string;
    allowedTypes: string[];
  };
  session: {
    expiryDays: number;
    cookieName: string;
    cookieSecret: string;
  };
  admin: {
    secretPath: string;
  };
  cors: {
    origin: string;
  };
}

const config: AppConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'fileshare',
    user: process.env.DB_USER || 'fileshare',
    password: process.env.DB_PASSWORD || 'fileshare_secret',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10), // 100MB default
    storagePath: process.env.UPLOAD_PATH || '/app/uploads',
    allowedTypes: process.env.ALLOWED_TYPES
      ? process.env.ALLOWED_TYPES.split(',')
      : ['*'],
  },

  session: {
    expiryDays: parseInt(process.env.SESSION_EXPIRY_DAYS || '7', 10),
    cookieName: process.env.SESSION_COOKIE_NAME || 'fs_sid',
    cookieSecret: process.env.COOKIE_SECRET || 'cookie-secret-change-me',
  },

  admin: {
    secretPath: process.env.ADMIN_SECRET_PATH || '/admin-secret-panel',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'https://localhost:3000',
  },
};

export default config;
