import pg from 'pg';
import { env } from '../config/env.js';

// date → 'AAAA-MM-DD' tal cual (sin corrimiento de zona); numeric → Number (montos con 2 decimales)
pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(1700, (v) => (v === null ? null : Number(v)));

export const pool = new pg.Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : undefined,
  max: 10,
});
