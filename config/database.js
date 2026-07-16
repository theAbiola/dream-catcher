import pg from 'pg';
import dotenv from 'dotenv';

if (process.env.NODE_ENV === 'development') {
  dotenv.config();
}
const { Pool } = pg;
  

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: 
    process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
});

export default pool;