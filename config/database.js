import pg from 'pg';
import dotenv from 'dotenv';

if (process.env.NODE_ENV === 'development') {
  dotenv.config();
}
const { Pool } = pg;

const useSsl = process.env.NODE_ENV === 'production' || process.env.DATABASE_SSL === 'true';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false
});

export default pool;