import './config/env-config.js';

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from './config/database.js';
import helmet from 'helmet'
import { initDatabase } from './config/database-init.js';
import dreamsRouter from './routes/dreams.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();


// Add security headers
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
}


const PORT = process.env.PORT || 5002;


// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));


// health endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1'); // SELECT 1 is a query used to access the DataBase. If it works, the DB is accessible. If it fails, then we know the DB can't be accessed.
    res.json({
      status: 'ok',
      db: 'Connected',
      uptime: process.uptime() // Returns the time it took for the server to start in Miliseconds.
    });
  } catch (error) {
    res.status(503).json({ // 503 means the particular service we're tryting to access via this endpoint is not available. It doesn't mean the server is unavailable.
      status: 'error',
      db: 'disconnected',
      message: error.message,
      uptime: process.uptime()
    });
  }
})


// shutdown endpoint: delete after testing
app.get('/shutdown', (req, res) => {
  console.log('=== MANUAL SHUTDOWN TRIGGERED ===')
  res.send('Shutting down...')

  setTimeout(() => {
    process.kill(process.pid, 'SIGTERM');
  }, 100)
})


// API Routes
app.use('/api/dreams', dreamsRouter);


// Gracefully handle Ctrl+C event.
process.on('SIGINT', () => {
  console.log('Starting graceful shutdown')
})


//Initialize the server instance
let server;


// Initialize database then start server
initDatabase().then(() => {
  server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1)
});


process.on('SIGTERM', gracefulShutdown)


async function gracefulShutdown() {
  console.log('SIGTERM received, shutting down server gracefully...')
    
  // Close the server first (stop accepting new connections)
  server.close(() => {
    console.log('HTTP server closed...')
  })

  // Then close database pool
  try {
    await pool.end();
    console.log('Database pool closed');
    process.exit(0)
  } catch (error) {
    console.error('Error closing database pool:', error)
    process.exit(1)
  }
}