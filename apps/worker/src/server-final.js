const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { PrismaClient } = require('@prisma/client');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// Import improved routes
const authRoutes = require('./routes/auth-improved');
const videoRoutes = require('./routes/videos-improved');
const billingRoutes = require('./routes/billing-improved');
const analyticsRoutes = require('./routes/analytics-improved');
const systemRoutes = require('./routes/system');

// Import existing routes
const dashboardRoutes = require('./routes/dashboard');
const projectRoutes = require('./routes/projects');
const processingRoutes = require('./routes/processing');

const app = express();
const prisma = new PrismaClient();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https:", "wss:"],
      mediaSrc: ["'self'", "blob:", "data:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [
          'https://reelremix.com', 
          'https://www.reelremix.com',
          'https://app.reelremix.com'
        ]
      : [
          'http://localhost:3000', 
          'http://localhost:3001', 
          'http://localhost:3002',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
          'http://127.0.0.1:3002'
        ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Request logging middleware (simple version)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Rate limiting (apply to all routes except health check)
app.use('/api', generalLimiter);

// Health check endpoint (before rate limiting and auth)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ReelRemix API Server',
    version: '1.0.0',
    documentation: '/api/system/endpoints',
    health: '/health'
  });
});

// API routes with improved error handling
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/system', systemRoutes);

// Existing routes (with fallback error handling)
try {
  app.use('/api/dashboard', dashboardRoutes);
} catch (error) {
  console.warn('Dashboard routes not available:', error.message);
}

try {
  app.use('/api/projects', projectRoutes);
} catch (error) {
  console.warn('Project routes not available:', error.message);
}

try {
  app.use('/api/processing', processingRoutes);
} catch (error) {
  console.warn('Processing routes not available:', error.message);
}

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'ReelRemix API v1.0',
    version: '1.0.0',
    baseUrl: `${req.protocol}://${req.get('host')}`,
    endpoints: {
      auth: '/api/auth - User authentication and management',
      videos: '/api/videos - Video upload and processing',
      billing: '/api/billing - Subscription and payment management',
      analytics: '/api/analytics - Performance tracking and insights',
      dashboard: '/api/dashboard - User dashboard data',
      projects: '/api/projects - Project management',
      processing: '/api/processing - Video processing pipeline',
      system: '/api/system - System health and monitoring'
    },
    documentation: '/api/system/endpoints'
  });
});

// Catch-all for API routes that don't exist
app.use('/api/*', notFoundHandler);

// 404 handler for non-API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    code: 'NOT_FOUND',
    suggestion: 'Visit /api for available endpoints'
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(`${signal} received, shutting down gracefully...`);
  
  try {
    // Close database connections
    await prisma.$disconnect();
    console.log('Database connections closed');
    
    // Close server
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ReelRemix API Server running on port ${PORT}`);
  console.log(`📚 API documentation: http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
  }
});

module.exports = app;
