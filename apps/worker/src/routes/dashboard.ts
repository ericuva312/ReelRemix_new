import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { authenticateToken } from './auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard overview data
router.get('/overview', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        credits: true,
        planType: true,
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get project statistics
    const [
      totalProjects,
      completedProjects,
      processingProjects,
      totalClips,
      recentProjects
    ] = await Promise.all([
      prisma.project.count({
        where: { userId }
      }),
      prisma.project.count({
        where: { userId, status: 'COMPLETED' }
      }),
      prisma.project.count({
        where: { userId, status: 'PROCESSING' }
      }),
      prisma.clip.count({
        where: { project: { userId } }
      }),
      prisma.project.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          _count: {
            select: { clips: true }
          }
        }
      })
    ]);

    // Calculate total views from analytics
    const analyticsData = await prisma.analytics.aggregate({
      where: {
        clip: {
          project: {
            userId
          }
        }
      },
      _sum: {
        views: true,
        likes: true,
        shares: true,
        comments: true,
      }
    });

    const stats = {
      totalProjects,
      completedProjects,
      processingProjects,
      totalClips,
      totalViews: analyticsData._sum.views || 0,
      totalLikes: analyticsData._sum.likes || 0,
      totalShares: analyticsData._sum.shares || 0,
      totalComments: analyticsData._sum.comments || 0,
    };

    res.json({
      success: true,
      user,
      stats,
      recentProjects,
    });

  } catch (error) {
    logger.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get analytics data for charts
router.get('/analytics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { period = '30d' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get projects created over time
    const projectsOverTime = await prisma.project.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Get clips performance
    const topClips = await prisma.clip.findMany({
      where: {
        project: { userId }
      },
      orderBy: {
        viralScore: 'desc'
      },
      take: 10,
      include: {
        project: {
          select: {
            title: true
          }
        },
        analytics: {
          select: {
            views: true,
            likes: true,
            shares: true,
            platform: true,
          }
        }
      }
    });

    // Get platform distribution
    const platformStats = await prisma.analytics.groupBy({
      by: ['platform'],
      where: {
        clip: {
          project: {
            userId
          }
        }
      },
      _sum: {
        views: true,
        likes: true,
        shares: true,
      },
      _count: {
        id: true
      }
    });

    res.json({
      success: true,
      analytics: {
        projectsOverTime: projectsOverTime.map(item => ({
          date: item.createdAt.toISOString().split('T')[0],
          count: item._count.id
        })),
        topClips: topClips.map(clip => ({
          id: clip.id,
          title: clip.title,
          projectTitle: clip.project.title,
          viralScore: clip.viralScore,
          duration: clip.duration,
          totalViews: clip.analytics.reduce((sum, a) => sum + a.views, 0),
          totalLikes: clip.analytics.reduce((sum, a) => sum + a.likes, 0),
          totalShares: clip.analytics.reduce((sum, a) => sum + a.shares, 0),
        })),
        platformStats: platformStats.map(stat => ({
          platform: stat.platform,
          views: stat._sum.views || 0,
          likes: stat._sum.likes || 0,
          shares: stat._sum.shares || 0,
          clips: stat._count.id,
        }))
      }
    });

  } catch (error) {
    logger.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get recent activity
router.get('/activity', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const limit = parseInt(req.query.limit as string) || 20;

    // Get recent projects and clips
    const [recentProjects, recentClips] = await Promise.all([
      prisma.project.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: Math.ceil(limit / 2),
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      prisma.clip.findMany({
        where: {
          project: { userId }
        },
        orderBy: { updatedAt: 'desc' },
        take: Math.ceil(limit / 2),
        include: {
          project: {
            select: {
              title: true
            }
          }
        }
      })
    ]);

    // Combine and sort activities
    const activities = [
      ...recentProjects.map(project => ({
        id: project.id,
        type: 'project',
        action: project.status === 'COMPLETED' ? 'completed' : 'created',
        title: project.title,
        timestamp: project.updatedAt,
        status: project.status,
      })),
      ...recentClips.map(clip => ({
        id: clip.id,
        type: 'clip',
        action: clip.status === 'COMPLETED' ? 'generated' : 'processing',
        title: clip.title,
        projectTitle: clip.project.title,
        timestamp: clip.updatedAt,
        status: clip.status,
        viralScore: clip.viralScore,
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, limit);

    res.json({
      success: true,
      activities,
    });

  } catch (error) {
    logger.error('Dashboard activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get user usage statistics
router.get('/usage', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;

    // Get current month usage
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Since we don't have account-based usage in the simplified schema,
    // we'll calculate usage directly from user's projects and clips
    const [
      totalVideosProcessed,
      totalClipsGenerated,
      totalMinutesProcessed,
      currentMonthProjects,
      currentMonthClips
    ] = await Promise.all([
      prisma.project.count({
        where: { userId, status: 'COMPLETED' }
      }),
      prisma.clip.count({
        where: { project: { userId } }
      }),
      prisma.project.aggregate({
        where: { userId, status: 'COMPLETED' },
        _sum: { duration: true }
      }),
      prisma.project.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(currentMonth + '-01')
          }
        }
      }),
      prisma.clip.count({
        where: {
          project: { userId },
          createdAt: {
            gte: new Date(currentMonth + '-01')
          }
        }
      })
    ]);

    // Get plan limits (mock data for now)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { planType: true, credits: true }
    });

    const planLimits = {
      FREE: { videos: 5, clips: 20, minutes: 60 },
      STARTER: { videos: 25, clips: 100, minutes: 300 },
      PRO: { videos: 100, clips: 500, minutes: 1200 },
      BUSINESS: { videos: -1, clips: -1, minutes: -1 }, // Unlimited
    };

    const limits = planLimits[user?.planType || 'FREE'];

    res.json({
      success: true,
      usage: {
        currentMonth: {
          videosProcessed: currentMonthProjects,
          clipsGenerated: currentMonthClips,
          minutesProcessed: Math.round((totalMinutesProcessed._sum.duration || 0) / 60),
        },
        allTime: {
          videosProcessed: totalVideosProcessed,
          clipsGenerated: totalClipsGenerated,
          minutesProcessed: Math.round((totalMinutesProcessed._sum.duration || 0) / 60),
        },
        limits,
        credits: user?.credits || 0,
        planType: user?.planType || 'FREE',
      }
    });

  } catch (error) {
    logger.error('Dashboard usage error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
