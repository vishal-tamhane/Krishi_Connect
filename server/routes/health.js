const express = require('express');
const router = express.Router();
const { db, logger } = require('../config/database');

/**
 * @route GET /health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    // Test database connection
    const dbResult = await db.query('SELECT 1 as test');
    const dbConnected = dbResult.rows[0].test === 1;
    
    // Get basic server info
    const serverInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'krishi-connect-server',
      version: '2.0.0',
      node_version: process.version,
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      database: {
        status: dbConnected ? 'connected' : 'disconnected',
        type: 'PostgreSQL'
      },
      environment: process.env.NODE_ENV || 'development'
    };
    
    const statusCode = dbConnected ? 200 : 503;
    
    res.status(statusCode).json({
      success: dbConnected,
      data: serverInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health check error:', error);
    
    res.status(503).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Service unhealthy',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /health/database
 * @desc Database health check
 * @access Public
 */
router.get('/database', async (req, res) => {
  try {
    const start = Date.now();
    
    // Test basic query
    const basicTest = await db.query('SELECT 1 as test');
    
    // Test table existence
    const tableTest = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'fields', 'crops', 'climate_damage_claims')
    `);
    
    // Test connection pool
    const poolInfo = db.pool ? {
      total_connections: db.pool.totalCount,
      idle_connections: db.pool.idleCount,
      waiting_connections: db.pool.waitingCount
    } : null;
    
    const responseTime = Date.now() - start;
    
    const dbHealth = {
      status: 'healthy',
      response_time_ms: responseTime,
      basic_query: basicTest.rows[0].test === 1,
      tables_exist: tableTest.rows.length === 4,
      connection_pool: poolInfo,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: dbHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Database health check error:', error);
    
    res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_HEALTH_CHECK_FAILED',
        message: 'Database health check failed',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /health/detailed
 * @desc Detailed health check with system metrics
 * @access Public
 */
router.get('/detailed', async (req, res) => {
  try {
    const start = Date.now();
    
    // Get database statistics
    const [dbTest, userCount, fieldCount, cropCount, claimCount] = await Promise.all([
      db.query('SELECT 1 as test'),
      db.query('SELECT COUNT(*) as count FROM users'),
      db.query('SELECT COUNT(*) as count FROM fields WHERE status = \'active\''),
      db.query('SELECT COUNT(*) as count FROM crops WHERE crop_status != \'deleted\''),
      db.query('SELECT COUNT(*) as count FROM climate_damage_claims')
    ]);
    
    const responseTime = Date.now() - start;
    
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      server: {
        node_version: process.version,
        uptime_seconds: Math.floor(process.uptime()),
        memory_usage: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
          heap_used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          heap_total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
        },
        cpu_usage: process.cpuUsage(),
        environment: process.env.NODE_ENV || 'development'
      },
      database: {
        status: 'connected',
        type: 'PostgreSQL',
        response_time_ms: responseTime,
        connection_pool: db.pool ? {
          total: db.pool.totalCount,
          idle: db.pool.idleCount,
          waiting: db.pool.waitingCount
        } : null,
        statistics: {
          total_users: parseInt(userCount.rows[0].count),
          active_fields: parseInt(fieldCount.rows[0].count),
          active_crops: parseInt(cropCount.rows[0].count),
          total_claims: parseInt(claimCount.rows[0].count)
        }
      },
      services: {
        authentication: 'operational',
        field_management: 'operational',
        crop_management: 'operational',
        climate_claims: 'operational',
        government_schemes: 'operational'
      }
    };
    
    res.json({
      success: true,
      data: detailedHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Detailed health check error:', error);
    
    res.status(503).json({
      success: false,
      error: {
        code: 'DETAILED_HEALTH_CHECK_FAILED',
        message: 'Detailed health check failed',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;