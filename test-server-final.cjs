const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
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
      callback(null, true); // Allow all origins for testing
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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check endpoint
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

// Mock API routes for testing
app.use('/api', (req, res, next) => {
  // Add mock delay
  setTimeout(next, Math.random() * 100);
});

// Auth routes
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required'
    });
  }
  
  // Mock successful signup
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      user: {
        id: 'user_' + Date.now(),
        name,
        email,
        credits: 100,
        createdAt: new Date().toISOString()
      },
      token: 'mock_jwt_token_' + Date.now()
    }
  });
});

app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  
  // Mock successful signin
  res.json({
    success: true,
    message: 'Signed in successfully',
    data: {
      user: {
        id: 'user_existing',
        name: 'Test User',
        email,
        credits: 75,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      token: 'mock_jwt_token_' + Date.now()
    }
  });
});

// Dashboard routes
app.get('/api/dashboard/overview', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalProjects: 12,
        totalClips: 48,
        totalViews: 125000,
        creditsRemaining: 75
      },
      recentProjects: [
        {
          id: 'proj_1',
          title: 'Podcast Episode #23',
          status: 'COMPLETED',
          clipsGenerated: 8,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'proj_2',
          title: 'Marketing Webinar',
          status: 'PROCESSING',
          clipsGenerated: 0,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    }
  });
});

// Video upload routes
app.post('/api/videos/upload', (req, res) => {
  const { title, description, url } = req.body;
  
  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Title is required'
    });
  }
  
  const uploadId = 'upload_' + Date.now();
  
  res.status(201).json({
    success: true,
    message: 'Video uploaded successfully and queued for processing',
    data: {
      uploadId,
      projectId: 'proj_' + Date.now(),
      status: 'QUEUED',
      creditsDeducted: 10
    }
  });
});

app.get('/api/videos/status/:id', (req, res) => {
  const { id } = req.params;
  
  // Mock processing status
  const statuses = ['QUEUED', 'PROCESSING', 'COMPLETED'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  const progress = randomStatus === 'COMPLETED' ? 100 : Math.floor(Math.random() * 90) + 10;
  
  res.json({
    success: true,
    data: {
      id,
      status: randomStatus,
      progress,
      message: randomStatus === 'COMPLETED' ? 'Processing completed successfully' : 'Analyzing video content...',
      clipsGenerated: randomStatus === 'COMPLETED' ? Math.floor(Math.random() * 10) + 5 : 0,
      clips: randomStatus === 'COMPLETED' ? [
        {
          id: 'clip_1',
          title: 'Viral Hook Moment',
          duration: '0:45',
          score: 95,
          status: 'READY'
        },
        {
          id: 'clip_2',
          title: 'Key Insight',
          duration: '0:38',
          score: 89,
          status: 'READY'
        }
      ] : []
    }
  });
});

// Billing routes
app.get('/api/billing/plans', (req, res) => {
  res.json({
    success: true,
    data: {
      plans: [
        {
          id: 'starter',
          name: 'Starter',
          price: 59,
          credits: 80,
          features: ['80 renders per month', '400 minutes source content', '3 preset styles'],
          popular: false
        },
        {
          id: 'pro',
          name: 'Pro',
          price: 99,
          credits: 240,
          features: ['240 renders per month', '1,200 minutes source content', 'Team collaboration'],
          popular: true
        },
        {
          id: 'business',
          name: 'Business',
          price: 199,
          credits: 999999,
          features: ['Unlimited renders', 'Unlimited source content', 'White-label solution'],
          popular: false
        }
      ]
    }
  });
});

// Analytics routes
app.get('/api/analytics/dashboard', (req, res) => {
  const { timeRange = 'month' } = req.query;
  
  res.json({
    success: true,
    data: {
      overview: {
        totalProjects: 12,
        totalClips: 48,
        totalViews: 125000,
        totalLikes: 8500,
        totalShares: 2100,
        totalComments: 1200,
        avgScore: 87.5,
        avgEngagement: 6.8
      },
      charts: {
        views: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: Math.floor(Math.random() * 1000) + 100
        })),
        engagement: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: Math.floor(Math.random() * 10) + 2
        }))
      },
      timeRange
    }
  });
});

// System routes
app.get('/api/system/endpoints', (req, res) => {
  res.json({
    success: true,
    data: {
      version: '1.0.0',
      baseUrl: `${req.protocol}://${req.get('host')}`,
      endpoints: {
        authentication: {
          base: '/api/auth',
          endpoints: [
            { method: 'POST', path: '/signup', description: 'Create new user account' },
            { method: 'POST', path: '/signin', description: 'Sign in user' }
          ]
        },
        videos: {
          base: '/api/videos',
          endpoints: [
            { method: 'POST', path: '/upload', description: 'Upload video for processing' },
            { method: 'GET', path: '/status/:id', description: 'Get processing status' }
          ]
        },
        dashboard: {
          base: '/api/dashboard',
          endpoints: [
            { method: 'GET', path: '/overview', description: 'Get dashboard overview' }
          ]
        },
        billing: {
          base: '/api/billing',
          endpoints: [
            { method: 'GET', path: '/plans', description: 'Get subscription plans' }
          ]
        },
        analytics: {
          base: '/api/analytics',
          endpoints: [
            { method: 'GET', path: '/dashboard', description: 'Get dashboard analytics' }
          ]
        }
      }
    }
  });
});

// Serve static files from React build
const buildPath = path.join(__dirname, 'apps/web/dist');
app.use(express.static(buildPath));

// Catch-all handler for React Router
app.get('*', (req, res) => {
  // If it's an API route that doesn't exist, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found',
      code: 'NOT_FOUND'
    });
  }
  
  // For all other routes, serve the React app
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// Start server
const PORT = process.env.PORT || 3002;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ReelRemix Test Server running on port ${PORT}`);
  console.log(`📚 API documentation: http://localhost:${PORT}/api/system/endpoints`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: testing`);
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
