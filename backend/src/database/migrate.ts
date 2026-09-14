import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'fileshare',
    user: process.env.DB_USER || 'fileshare',
    password: process.env.DB_PASSWORD || 'fileshare_secret',
  });

  try {
    console.log('🔄 Running database migrations...');

    const sql = await fs.readFile(path.join(__dirname, 'init.sql'), 'utf-8');
    await pool.query(sql);

    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
