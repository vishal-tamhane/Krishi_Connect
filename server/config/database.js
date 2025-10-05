const { Pool } = require('pg');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

class DatabaseConfig {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    
    // Database configuration
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'krishi_connect',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  }

  async connect() {
    try {
      // Create connection pool
      this.pool = new Pool(this.config);
      
      // Test connection
      const client = await this.pool.connect();
      const result = await client.query('SELECT 1 as test');
      client.release();
      
      if (result.rows[0].test === 1) {
        this.isConnected = true;
        logger.info('✅ Connected to PostgreSQL successfully');
        
        // Log pool events
        this.pool.on('connect', (client) => {
          logger.debug('New client connected to PostgreSQL');
        });
        
        this.pool.on('error', (err, client) => {
          logger.error('Unexpected error on idle client', err);
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('❌ Failed to connect to PostgreSQL:', error.message);
      return false;
    }
  }

  async query(text, params = []) {
    if (!this.pool) {
      throw new Error('Database not connected');
    }
    
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Executed query', {
        text: text.slice(0, 100) + '...',
        duration,
        rows: result.rowCount
      });
      
      return result;
    } catch (error) {
      logger.error('Database query error:', {
        text: text.slice(0, 100) + '...',
        error: error.message,
        params
      });
      throw error;
    }
  }

  async getClient() {
    if (!this.pool) {
      throw new Error('Database not connected');
    }
    return await this.pool.connect();
  }

  async transaction(callback) {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      logger.info('🔒 PostgreSQL connections closed');
    }
  }

  // Utility functions for data conversion
  static convertUUIDsToStrings(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => DatabaseConfig.convertUUIDsToStrings(item));
    } else if (obj && typeof obj === 'object') {
      const converted = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object' && value.constructor.name === 'Buffer') {
          // Handle UUID conversion if needed
          converted[key] = value.toString();
        } else if (value instanceof Date) {
          converted[key] = value.toISOString();
        } else if (value && typeof value === 'object') {
          converted[key] = DatabaseConfig.convertUUIDsToStrings(value);
        } else {
          converted[key] = value;
        }
      }
      return converted;
    }
    return obj;
  }

  static sanitizeForJSON(obj) {
    return JSON.parse(JSON.stringify(obj, (key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }));
  }
}

// Create global database instance
const db = new DatabaseConfig();

module.exports = {
  DatabaseConfig,
  db,
  logger
};