const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['https://reel-remix-new-web.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ReelRemix API Server',
    status: 'running',
    endpoints: [
      'GET /health - Health check',
      'POST /api/auth/signup - User registration',
      'POST /api/auth/signin - User login'
    ]
  });
});

// User registration endpoint
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;
  
  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required'
    });
  }
  
  // Simulate successful registration
  res.json({
    success: true,
    message: 'Account created successfully',
    user: {
      id: Date.now(),
      name: name,
      email: email,
      credits: 100
    },
    token: 'demo_token_' + Date.now()
  });
});

// User login endpoint
app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  
  // Simulate successful login
  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: 12345,
      name: 'Demo User',
      email: email,
      credits: 75
    },
    token: 'demo_token_' + Date.now()
  });
});

// Catch all 404s
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: ['/', '/health', '/api/auth/signup', '/api/auth/signin']
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ReelRemix API Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
