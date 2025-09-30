const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// System health check
router.get('/health',
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    
    // Check database connectivity
    let dbStatus = 'healthy';
    let dbResponseTime = 0;
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - dbStart;
    } catch (error) {
      dbStatus = 'unhealthy';
      dbResponseTime = Date.now() - startTime;
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memoryStatus = memUsage.heapUsed / memUsage.heapTotal < 0.9 ? 'healthy' : 'warning';

    // Check uptime
    const uptime = process.uptime();

    const health = {
      status: dbStatus === 'healthy' && memoryStatus === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      responseTime: Date.now() - startTime,
      services: {
        database: {
          status: dbStatus,
          responseTime: dbResponseTime
        },
        memory: {
          status: memoryStatus,
          usage: {
            used: Math.round(memUsage.heapUsed / 1024 / 1024),
            total: Math.round(memUsage.heapTotal / 1024 / 1024),
            percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
          }
        },
        api: {
          status: 'healthy',
          version: '1.0.0'
        }
      }
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });
  })
);

// Detailed system status
router.get('/status',
  asyncHandler(async (req, res) => {
    // Get system metrics
    const [userCount, projectCount, clipCount] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.clip.count()
    ]);

    // Get recent activity (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [recentUsers, recentProjects, recentClips] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: yesterday } }
      }),
      prisma.project.count({
        where: { createdAt: { gte: yesterday } }
      }),
      prisma.clip.count({
        where: { createdAt: { gte: yesterday } }
      })
    ]);

    // System information
    const systemInfo = {
      platform: process.platform,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    res.json({
      success: true,
      data: {
        system: systemInfo,
        metrics: {
          total: {
            users: userCount,
            projects: projectCount,
            clips: clipCount
          },
          recent24h: {
            users: recentUsers,
            projects: recentProjects,
            clips: recentClips
          }
        },
        timestamp: new Date().toISOString()
      }
    });
  })
);

// API endpoints documentation
router.get('/endpoints',
  asyncHandler(async (req, res) => {
    const endpoints = {
      authentication: {
        base: '/api/auth',
        endpoints: [
          { method: 'POST', path: '/signup', description: 'Create new user account' },
          { method: 'POST', path: '/signin', description: 'Sign in user' },
          { method: 'GET', path: '/profile', description: 'Get user profile' },
          { method: 'PUT', path: '/profile', description: 'Update user profile' },
          { method: 'PUT', path: '/password', description: 'Change password' },
          { method: 'POST', path: '/refresh', description: 'Refresh JWT token' },
          { method: 'POST', path: '/signout', description: 'Sign out user' },
          { method: 'GET', path: '/stats', description: 'Get user statistics' }
        ]
      },
      videos: {
        base: '/api/videos',
        endpoints: [
          { method: 'POST', path: '/upload', description: 'Upload video for processing' },
          { method: 'GET', path: '/status/:id', description: 'Get processing status' },
          { method: 'GET', path: '/', description: 'Get user videos with pagination' },
          { method: 'GET', path: '/:id', description: 'Get specific video/project' },
          { method: 'DELETE', path: '/:id', description: 'Delete video/project' },
          { method: 'POST', path: '/:id/cancel', description: 'Cancel processing' }
        ]
      },
      dashboard: {
        base: '/api/dashboard',
        endpoints: [
          { method: 'GET', path: '/overview', description: 'Get dashboard overview' },
          { method: 'GET', path: '/analytics', description: 'Get analytics data' },
          { method: 'GET', path: '/activity', description: 'Get recent activity' }
        ]
      },
      projects: {
        base: '/api/projects',
        endpoints: [
          { method: 'GET', path: '/', description: 'Get user projects' },
          { method: 'POST', path: '/', description: 'Create new project' },
          { method: 'GET', path: '/:id', description: 'Get specific project' },
          { method: 'PUT', path: '/:id', description: 'Update project' },
          { method: 'DELETE', path: '/:id', description: 'Delete project' },
          { method: 'POST', path: '/:id/duplicate', description: 'Duplicate project' }
        ]
      },
      processing: {
        base: '/api/processing',
        endpoints: [
          { method: 'POST', path: '/start', description: 'Start video processing' },
          { method: 'GET', path: '/status/:id', description: 'Get processing status' },
          { method: 'POST', path: '/cancel/:id', description: 'Cancel processing' }
        ]
      },
      billing: {
        base: '/api/billing',
        endpoints: [
          { method: 'GET', path: '/plans', description: 'Get subscription plans' },
          { method: 'GET', path: '/subscription', description: 'Get user subscription' },
          { method: 'POST', path: '/checkout', description: 'Create checkout session' },
          { method: 'POST', path: '/cancel', description: 'Cancel subscription' },
          { method: 'POST', path: '/credits/purchase', description: 'Purchase credits' },
          { method: 'GET', path: '/history', description: 'Get billing history' }
        ]
      },
      analytics: {
        base: '/api/analytics',
        endpoints: [
          { method: 'POST', path: '/track', description: 'Track analytics event' },
          { method: 'GET', path: '/dashboard', description: 'Get dashboard analytics' },
          { method: 'GET', path: '/project/:id', description: 'Get project analytics' },
          { method: 'GET', path: '/clip/:id', description: 'Get clip analytics' },
          { method: 'GET', path: '/insights', description: 'Get performance insights' },
          { method: 'GET', path: '/export', description: 'Export analytics data' }
        ]
      },
      system: {
        base: '/api/system',
        endpoints: [
          { method: 'GET', path: '/health', description: 'System health check' },
          { method: 'GET', path: '/status', description: 'Detailed system status' },
          { method: 'GET', path: '/endpoints', description: 'API documentation' }
        ]
      }
    };

    res.json({
      success: true,
      data: {
        version: '1.0.0',
        baseUrl: req.protocol + '://' + req.get('host'),
        endpoints
      }
    });
  })
);

// Performance metrics
router.get('/metrics',
  asyncHandler(async (req, res) => {
    const metrics = {
      timestamp: new Date().toISOString(),
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      requests: {
        // In production, these would be tracked by middleware
        total: Math.floor(Math.random() * 10000) + 1000,
        successful: Math.floor(Math.random() * 9500) + 950,
        failed: Math.floor(Math.random() * 500) + 50,
        avgResponseTime: Math.floor(Math.random() * 200) + 50
      },
      database: {
        connections: Math.floor(Math.random() * 10) + 5,
        avgQueryTime: Math.floor(Math.random() * 50) + 10
      }
    };

    res.json({
      success: true,
      data: metrics
    });
  })
);

module.exports = router;
