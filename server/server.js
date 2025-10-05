require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import database configuration
const { db, logger } = require('./config/database');

// Import route handlers
const authRoutes = require('./routes/auth');
const fieldRoutes = require('./routes/fields');
const cropRoutes = require('./routes/crops');
const climateClaimRoutes = require('./routes/climateClaims');
const dashboardRoutes = require('./routes/dashboard');
const governmentSchemeRoutes = require('./routes/governmentSchemes');
const healthRoutes = require('./routes/health');

// Import database initialization
const { initializeDatabase, checkDatabaseStatus } = require('./scripts/initDatabase');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5002;
const HOST = process.env.HOST || 'localhost';

// ================================================================
// MIDDLEWARE SETUP
// ================================================================

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later',
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',');
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
});

// ================================================================
// ROUTES SETUP
// ================================================================

// Health check routes (no authentication required)
app.use('/health', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/climate-damage-claims', climateClaimRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/government-schemes', governmentSchemeRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Krishi Connect API Server',
    version: '2.0.0',
    description: 'Node.js/Express server with PostgreSQL database',
    endpoints: {
      health: '/health',
      api_docs: '/api',
      authentication: '/api/auth',
      fields: '/api/fields',
      crops: '/api/crops',
      climate_claims: '/api/climate-damage-claims',
      dashboard: '/api/dashboard',
      government_schemes: '/api/government-schemes'
    },
    timestamp: new Date().toISOString()
  });
});

// API info route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    api: {
      name: 'Krishi Connect API',
      version: '2.0.0',
      description: 'Comprehensive agricultural management system API',
      base_url: `http://${HOST}:${PORT}/api`,
      documentation: {
        postman_collection: 'Available on request',
        swagger_docs: 'Coming soon'
      },
      endpoints: {
        auth: {
          register: 'POST /api/auth/register',
          login: 'POST /api/auth/login',
          profile: 'GET /api/auth/profile',
          logout: 'POST /api/auth/logout'
        },
        fields: {
          create: 'POST /api/fields',
          list: 'GET /api/fields',
          detail: 'GET /api/fields/:id',
          update: 'PUT /api/fields/:id',
          delete: 'DELETE /api/fields/:id'
        },
        crops: {
          create: 'POST /api/crops',
          list: 'GET /api/crops',
          detail: 'GET /api/crops/:id',
          add_irrigation: 'POST /api/crops/:id/irrigation',
          add_fertilizer: 'POST /api/crops/:id/fertilizer'
        },
        climate_claims: {
          create: 'POST /api/climate-damage-claims',
          list: 'GET /api/climate-damage-claims',
          detail: 'GET /api/climate-damage-claims/:id',
          government_review: 'GET /api/climate-damage-claims/government/all'
        },
        dashboard: {
          farmer: 'GET /api/dashboard/farmer',
          government: 'GET /api/dashboard/government',
          analytics: 'GET /api/dashboard/analytics'
        },
        government_schemes: {
          list: 'GET /api/government-schemes',
          detail: 'GET /api/government-schemes/:code'
        }
      }
    },
    timestamp: new Date().toISOString()
  });
});

// ================================================================
// ERROR HANDLING MIDDLEWARE
// ================================================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`,
      timestamp: new Date().toISOString()
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  
  // CORS error
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CORS_ERROR',
        message: 'Not allowed by CORS policy',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // Default error response
  res.status(error.status || 500).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }
  });
});

// ================================================================
// SERVER STARTUP
// ================================================================

async function startServer() {
  try {
    console.log('=' * 80);
    console.log('🌾 KRISHI CONNECT - NODE.JS/EXPRESS SERVER 🌾');
    console.log('=' * 80);
    
    // Connect to database
    logger.info('📋 Connecting to PostgreSQL database...');
    const dbConnected = await db.connect();
    
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }
    
    // Check database status
    const dbStatus = await checkDatabaseStatus();
    
    if (!dbStatus.database_ready) {
      logger.warn('⚠️ Database not fully initialized. Initializing...');
      await initializeDatabase();
    } else {
      logger.info('✅ Database is ready');
    }
    
    // Start server
    const server = app.listen(PORT, HOST, () => {
      console.log('\n🚀 SERVER STARTED SUCCESSFULLY!');
      console.log('=' * 50);
      console.log(`🌐 Server URL: http://${HOST}:${PORT}`);
      console.log(`🏥 Health Check: http://${HOST}:${PORT}/health`);
      console.log(`📚 API Documentation: http://${HOST}:${PORT}/api`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Database: PostgreSQL (Connected)`);
      console.log(`📊 Tables: ${dbStatus.tables_exist}/${dbStatus.expected_tables} ready`);
      console.log('=' * 50);
      console.log('✅ Ready to accept requests!');
      console.log('\n📝 Available endpoints:');
      console.log('   • POST /api/auth/register - User registration');
      console.log('   • POST /api/auth/login - User login');
      console.log('   • GET  /api/fields - Field management');
      console.log('   • GET  /api/crops - Crop lifecycle');
      console.log('   • GET  /api/climate-damage-claims - Climate claims');
      console.log('   • GET  /api/dashboard/farmer - Farmer dashboard');
      console.log('   • GET  /api/dashboard/government - Government dashboard');
      console.log('   • GET  /api/government-schemes - Government schemes');
      console.log('\n🛠️ Use Ctrl+C to stop the server');
      console.log('=' * 80);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Starting graceful shutdown...');
      server.close(async () => {
        logger.info('HTTP server closed');
        await db.close();
        logger.info('Database connections closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      logger.info('SIGINT received. Starting graceful shutdown...');
      server.close(async () => {
        logger.info('HTTP server closed');
        await db.close();
        logger.info('Database connections closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    
    console.log('\n❌ SERVER STARTUP FAILED!');
    console.log('=' * 50);
    console.log('Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check PostgreSQL connection settings in .env file');
    console.log('2. Ensure PostgreSQL server is running');
    console.log('3. Verify database credentials and permissions');
    console.log('4. Check if required environment variables are set');
    console.log('=' * 50);
    
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;