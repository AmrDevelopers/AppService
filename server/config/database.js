import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Validate required configuration
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required database configuration variables:', missingVars.join(', '));
  process.exit(1);
}

// SSL Configuration (if using remote DB)
const sslConfig = process.env.DB_SSL === 'true' ? {
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.DB_CA_CERT,
    key: process.env.DB_CLIENT_KEY,
    cert: process.env.DB_CLIENT_CERT
  }
} : {};

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,
  queueLimit: 0,
  namedPlaceholders: true,
  timezone: '+00:00',
  supportBigNumbers: true,
  bigNumberStrings: true,
  ...sslConfig,
  connectTimeout: 10000, // 10 seconds
  acquireTimeout: 10000, // 10 seconds
  ...(process.env.NODE_ENV === 'production' && {
    waitForConnections: false
  })
});

// Connection event listeners
let connectionCount = 0;

pool.on('connection', (connection) => {
  connectionCount++;
  console.log(`New DB connection established. Active connections: ${connectionCount}`);
});

pool.on('acquire', (connection) => {
  console.log(`Connection ${connection.threadId} acquired`);
});

pool.on('release', (connection) => {
  console.log(`Connection ${connection.threadId} released`);
});

pool.on('enqueue', () => {
  console.log('Waiting for available connection slot');
});

// Test connection on startup
let connectionAttempts = 0;
const maxConnectionAttempts = 3;
const retryDelay = 5000; // 5 seconds

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to the database');
    
    // Verify database version
    const [rows] = await connection.query('SELECT VERSION() AS version');
    console.log(`MySQL Server version: ${rows[0].version}`);
    
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    
    if (connectionAttempts < maxConnectionAttempts) {
      connectionAttempts++;
      console.log(`Retrying connection (attempt ${connectionAttempts}/${maxConnectionAttempts}) in ${retryDelay/1000} seconds...`);
      setTimeout(testConnection, retryDelay);
    } else {
      console.error('Maximum connection attempts reached. Exiting...');
      process.exit(1);
    }
  }
}

// Validate connections in pool
async function validateConnection(connection) {
  try {
    await connection.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Connection validation failed:', error.message);
    return false;
  }
}

// Graceful shutdown handler
async function gracefulShutdown() {
  console.log('Closing database connection pool...');
  try {
    await pool.end();
    console.log('Database connection pool closed');
  } catch (error) {
    console.error('Error closing connection pool:', error);
  }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Initialize connection
testConnection();

export default pool;