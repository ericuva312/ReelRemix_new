const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { validateIdParam } = require('../middleware/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to get date range
const getDateRange = (timeRange) => {
  const now = new Date();
  let startDate;

  switch (timeRange) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { startDate, endDate: now };
};

// Helper function to generate mock analytics data
const generateMockData = (days) => {
  const data = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    data.push({
      date: date.toISOString().split('T')[0],
      views: Math.floor(Math.random() * 1000) + 100,
      likes: Math.floor(Math.random() * 100) + 10,
      shares: Math.floor(Math.random() * 50) + 5,
      comments: Math.floor(Math.random() * 30) + 2,
      engagement: Math.floor(Math.random() * 10) + 2
    });
  }
  
  return data;
};

// Track analytics event
router.post('/track',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { event, properties = {} } = req.body;

    if (!event) {
      throw new AppError('Event name is required', 'MISSING_EVENT', 400);
    }

    // Create analytics record
    await prisma.analytics.create({
      data: {
        id: Math.random().toString(36).substring(2, 15),
        userId: req.user.id,
        event,
        properties: JSON.stringify(properties),
        timestamp: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Event tracked successfully'
    });
  })
);

// Get user dashboard analytics
router.get('/dashboard',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { timeRange = 'month' } = req.query;
    const { startDate, endDate } = getDateRange(timeRange);

    // Get user's projects and clips within date range
    const [projects, clips] = await Promise.all([
      prisma.project.findMany({
        where: {
          userId: req.user.id,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          clips: true
        }
      }),
      prisma.clip.findMany({
        where: {
          project: { userId: req.user.id },
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      })
    ]);

    // Calculate metrics
    const totalProjects = projects.length;
    const totalClips = clips.length;
    const avgScore = clips.length > 0 
      ? clips.reduce((sum, clip) => sum + (clip.score || 0), 0) / clips.length 
      : 0;

    // Generate mock performance data
    const performanceData = generateMockData(timeRange === 'day' ? 24 : timeRange === 'week' ? 7 : 30);

    // Calculate totals
    const totalViews = performanceData.reduce((sum, day) => sum + day.views, 0);
    const totalLikes = performanceData.reduce((sum, day) => sum + day.likes, 0);
    const totalShares = performanceData.reduce((sum, day) => sum + day.shares, 0);
    const totalComments = performanceData.reduce((sum, day) => sum + day.comments, 0);
    const avgEngagement = performanceData.reduce((sum, day) => sum + day.engagement, 0) / performanceData.length;

    res.json({
      success: true,
      data: {
        overview: {
          totalProjects,
          totalClips,
          totalViews,
          totalLikes,
          totalShares,
          totalComments,
          avgScore: Math.round(avgScore * 10) / 10,
          avgEngagement: Math.round(avgEngagement * 10) / 10
        },
        charts: {
          views: performanceData.map(d => ({ date: d.date, value: d.views })),
          engagement: performanceData.map(d => ({ date: d.date, value: d.engagement })),
          likes: performanceData.map(d => ({ date: d.date, value: d.likes })),
          shares: performanceData.map(d => ({ date: d.date, value: d.shares }))
        },
        timeRange
      }
    });
  })
);

// Get project-specific analytics
router.get('/project/:id',
  authenticateToken,
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { timeRange = 'month' } = req.query;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: req.user.id
      },
      include: {
        clips: {
          orderBy: { score: 'desc' }
        }
      }
    });

    if (!project) {
      throw new AppError('Project not found', 'PROJECT_NOT_FOUND', 404);
    }

    // Generate mock analytics for this project
    const performanceData = generateMockData(30);
    const clipPerformance = project.clips.map(clip => ({
      id: clip.id,
      title: clip.title,
      score: clip.score,
      views: Math.floor(Math.random() * 10000) + 1000,
      likes: Math.floor(Math.random() * 1000) + 100,
      shares: Math.floor(Math.random() * 500) + 50,
      comments: Math.floor(Math.random() * 200) + 20,
      engagement: Math.floor(Math.random() * 10) + 2
    }));

    res.json({
      success: true,
      data: {
        project: {
          id: project.id,
          title: project.title,
          createdAt: project.createdAt,
          clipsCount: project.clips.length
        },
        performance: {
          totalViews: clipPerformance.reduce((sum, clip) => sum + clip.views, 0),
          totalLikes: clipPerformance.reduce((sum, clip) => sum + clip.likes, 0),
          totalShares: clipPerformance.reduce((sum, clip) => sum + clip.shares, 0),
          totalComments: clipPerformance.reduce((sum, clip) => sum + clip.comments, 0),
          avgScore: project.clips.reduce((sum, clip) => sum + (clip.score || 0), 0) / project.clips.length || 0
        },
        charts: {
          views: performanceData.map(d => ({ date: d.date, value: d.views })),
          engagement: performanceData.map(d => ({ date: d.date, value: d.engagement }))
        },
        clips: clipPerformance
      }
    });
  })
);

// Get clip-specific analytics
router.get('/clip/:id',
  authenticateToken,
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find clip and verify ownership
    const clip = await prisma.clip.findFirst({
      where: {
        id,
        project: { userId: req.user.id }
      },
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!clip) {
      throw new AppError('Clip not found', 'CLIP_NOT_FOUND', 404);
    }

    // Generate mock detailed analytics for this clip
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      views: Math.floor(Math.random() * 100) + 10,
      likes: Math.floor(Math.random() * 20) + 2,
      shares: Math.floor(Math.random() * 10) + 1
    }));

    const platformData = [
      { platform: 'TikTok', views: Math.floor(Math.random() * 5000) + 1000, percentage: 45 },
      { platform: 'Instagram', views: Math.floor(Math.random() * 3000) + 800, percentage: 30 },
      { platform: 'YouTube', views: Math.floor(Math.random() * 2000) + 500, percentage: 20 },
      { platform: 'Twitter', views: Math.floor(Math.random() * 1000) + 200, percentage: 5 }
    ];

    const demographics = {
      age: [
        { range: '13-17', percentage: 15 },
        { range: '18-24', percentage: 35 },
        { range: '25-34', percentage: 30 },
        { range: '35-44', percentage: 15 },
        { range: '45+', percentage: 5 }
      ],
      gender: [
        { type: 'Female', percentage: 55 },
        { type: 'Male', percentage: 42 },
        { type: 'Other', percentage: 3 }
      ]
    };

    res.json({
      success: true,
      data: {
        clip: {
          id: clip.id,
          title: clip.title,
          score: clip.score,
          duration: clip.duration,
          createdAt: clip.createdAt,
          project: clip.project
        },
        performance: {
          totalViews: hourlyData.reduce((sum, hour) => sum + hour.views, 0),
          totalLikes: hourlyData.reduce((sum, hour) => sum + hour.likes, 0),
          totalShares: hourlyData.reduce((sum, hour) => sum + hour.shares, 0),
          engagementRate: Math.floor(Math.random() * 10) + 2
        },
        charts: {
          hourly: hourlyData,
          platforms: platformData
        },
        demographics
      }
    });
  })
);

// Get user activity feed
router.get('/activity',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { limit = 20, offset = 0 } = req.query;

    // Get recent analytics events
    const events = await prisma.analytics.findMany({
      where: { userId: req.user.id },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const activities = events.map(event => ({
      id: event.id,
      event: event.event,
      properties: JSON.parse(event.properties || '{}'),
      timestamp: event.timestamp
    }));

    res.json({
      success: true,
      data: { activities }
    });
  })
);

// Get performance insights
router.get('/insights',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { timeRange = 'month' } = req.query;

    // Get user's clips for analysis
    const clips = await prisma.clip.findMany({
      where: {
        project: { userId: req.user.id }
      },
      orderBy: { score: 'desc' },
      take: 100
    });

    // Generate insights
    const insights = [
      {
        type: 'performance',
        title: 'Top Performing Content',
        description: 'Your clips with scores above 85 get 3x more engagement',
        action: 'Focus on creating content similar to your highest-scoring clips'
      },
      {
        type: 'timing',
        title: 'Optimal Posting Time',
        description: 'Your content performs best when posted between 6-8 PM',
        action: 'Schedule your posts during peak engagement hours'
      },
      {
        type: 'content',
        title: 'Content Recommendation',
        description: 'Educational content gets 40% more shares than entertainment',
        action: 'Consider creating more how-to and tutorial content'
      },
      {
        type: 'platform',
        title: 'Platform Optimization',
        description: 'Your TikTok content outperforms other platforms by 60%',
        action: 'Prioritize TikTok-optimized content creation'
      }
    ];

    res.json({
      success: true,
      data: {
        insights,
        summary: {
          totalClips: clips.length,
          avgScore: clips.reduce((sum, clip) => sum + (clip.score || 0), 0) / clips.length || 0,
          topScore: clips[0]?.score || 0,
          improvementPotential: Math.floor(Math.random() * 30) + 10
        }
      }
    });
  })
);

// Export analytics data
router.get('/export',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { format = 'json', timeRange = 'month' } = req.query;
    const { startDate, endDate } = getDateRange(timeRange);

    // Get user's data
    const [projects, clips, analytics] = await Promise.all([
      prisma.project.findMany({
        where: {
          userId: req.user.id,
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.clip.findMany({
        where: {
          project: { userId: req.user.id },
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.analytics.findMany({
        where: {
          userId: req.user.id,
          timestamp: { gte: startDate, lte: endDate }
        }
      })
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      timeRange,
      summary: {
        projects: projects.length,
        clips: clips.length,
        events: analytics.length
      },
      projects,
      clips,
      analytics: analytics.map(a => ({
        ...a,
        properties: JSON.parse(a.properties || '{}')
      }))
    };

    if (format === 'csv') {
      // In production, convert to CSV format
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.csv');
      res.send('CSV export would be generated here');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.json');
      res.json(exportData);
    }
  })
);

module.exports = router;
