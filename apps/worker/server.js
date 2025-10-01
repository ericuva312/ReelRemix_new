const http = require('http' );
const url = require('url');

// Simple in-memory storage
const users = new Map();
const generateId = () => Math.random().toString(36).substr(2, 9);
const generateToken = () => 'token_' + Math.random().toString(36).substr(2, 15);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

function sendJSON(res, status, data) {
  res.writeHead(status, corsHeaders);
  res.end(JSON.stringify(data));
}

function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      callback(null, body ? JSON.parse(body) : {});
    } catch (e) {
      callback(e);
    }
  });
}

const server = http.createServer((req, res ) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  
  const { pathname } = url.parse(req.url);
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // Health check
  if (pathname === '/health') {
    sendJSON(res, 200, { 
      success: true, 
      message: 'Server healthy',
      timestamp: new Date().toISOString(),
      port: process.env.PORT || 3000
    });
    return;
  }

  // Root
  if (pathname === '/') {
    sendJSON(res, 200, { 
      success: true, 
      message: 'ReelRemix API',
      version: '1.0.0',
      endpoints: ['/health', '/api/auth/signup', '/api/auth/signin', '/api/dashboard/overview']
    });
    return;
  }

  // Signup
  if (pathname === '/api/auth/signup' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) return sendJSON(res, 400, { success: false, message: 'Invalid JSON' });
      
      const { name, email, password } = body;
      if (!name || !email || !password) {
        return sendJSON(res, 400, { success: false, message: 'Missing fields' });
      }

      // Check if user exists
      for (const user of users.values()) {
        if (user.email === email) {
          return sendJSON(res, 400, { success: false, message: 'User exists' });
        }
      }

      const userId = generateId();
      const token = generateToken();
      const user = { 
        id: userId, 
        name, 
        email, 
        credits: 100, 
        plan: 'starter', 
        createdAt: new Date().toISOString(), 
        token 
      };
      
      users.set(userId, user);
      
      sendJSON(res, 201, {
        success: true,
        message: 'User created',
        data: {
          user: { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            credits: user.credits, 
            plan: user.plan, 
            createdAt: user.createdAt 
          },
          token: user.token
        }
      });
    });
    return;
  }

  // Signin
  if (pathname === '/api/auth/signin' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) return sendJSON(res, 400, { success: false, message: 'Invalid JSON' });
      
      const { email, password } = body;
      if (!email || !password) {
        return sendJSON(res, 400, { success: false, message: 'Missing credentials' });
      }

      let user = null;
      for (const userData of users.values()) {
        if (userData.email === email) {
          user = userData;
          break;
        }
      }

      if (!user) {
        return sendJSON(res, 401, { success: false, message: 'Invalid credentials' });
      }

      sendJSON(res, 200, {
        success: true,
        message: 'Signed in',
        data: {
          user: { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            credits: user.credits, 
            plan: user.plan, 
            createdAt: user.createdAt 
          },
          token: user.token
        }
      });
    });
    return;
  }

  // Dashboard
  if (pathname === '/api/dashboard/overview' && req.method === 'GET') {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return sendJSON(res, 401, { success: false, message: 'No token' });
    }

    let user = null;
    for (const userData of users.values()) {
      if (userData.token === token) {
        user = userData;
        break;
      }
    }

    if (!user) {
      return sendJSON(res, 403, { success: false, message: 'Invalid token' });
    }

    sendJSON(res, 200, {
      success: true,
      data: {
        stats: {
          totalProjects: 0,
          completedProjects: 0,
          totalClips: 0,
          creditsRemaining: user.credits,
          plan: user.plan
        },
        recentProjects: []
      }
    });
    return;
  }

  // 404
  sendJSON(res, 404, { success: false, message: 'Not found' });
});

// Use Railway's provided port or fallback to 3000
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🚀 ReelRemix server running on ${HOST}:${PORT}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
