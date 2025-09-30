import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { authenticateToken } from './auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
});

// Get all projects for user
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId };
    
    if (status && ['PROCESSING', 'COMPLETED', 'FAILED'].includes(status)) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          clips: {
            select: {
              id: true,
              title: true,
              duration: true,
              viralScore: true,
              status: true,
              thumbnailUrl: true,
            },
            orderBy: { viralScore: 'desc' },
            take: 3, // Show top 3 clips per project
          },
          _count: {
            select: { clips: true }
          }
        }
      }),
      prisma.project.count({ where })
    ]);

    res.json({
      success: true,
      projects,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      }
    });

  } catch (error) {
    logger.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get specific project
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        clips: {
          orderBy: { viralScore: 'desc' },
          include: {
            analytics: {
              select: {
                platform: true,
                views: true,
                likes: true,
                shares: true,
                comments: true,
                engagement: true,
              }
            }
          }
        },
        uploads: {
          include: {
            transcripts: true,
            segments: {
              orderBy: { score: 'desc' }
            }
          }
        },
        _count: {
          select: { clips: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Calculate project analytics
    const totalAnalytics = project.clips.reduce((acc, clip) => {
      clip.analytics.forEach(analytics => {
        acc.views += analytics.views;
        acc.likes += analytics.likes;
        acc.shares += analytics.shares;
        acc.comments += analytics.comments;
      });
      return acc;
    }, { views: 0, likes: 0, shares: 0, comments: 0 });

    const projectWithAnalytics = {
      ...project,
      analytics: totalAnalytics,
      avgViralScore: project.clips.length > 0 
        ? project.clips.reduce((sum, clip) => sum + clip.viralScore, 0) / project.clips.length 
        : 0,
    };

    res.json({
      success: true,
      project: projectWithAnalytics,
    });

  } catch (error) {
    logger.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new project
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const validatedData = createProjectSchema.parse(req.body);

    const project = await prisma.project.create({
      data: {
        ...validatedData,
        userId,
        status: 'PROCESSING',
      },
      include: {
        _count: {
          select: { clips: true }
        }
      }
    });

    logger.info('Project created', { userId, projectId: project.id });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    logger.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update project
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { id } = req.params;
    const validatedData = updateProjectSchema.parse(req.body);

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: { id, userId }
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: { clips: true }
        }
      }
    });

    logger.info('Project updated', { userId, projectId: id });

    res.json({
      success: true,
      message: 'Project updated successfully',
      project: updatedProject,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    logger.error('Update project error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete project
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { id } = req.params;

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: { id, userId }
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Delete project (cascades to clips and analytics)
    await prisma.project.delete({
      where: { id }
    });

    logger.info('Project deleted', { userId, projectId: id });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    logger.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get project clips
router.get('/:id/clips', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { id } = req.params;
    const sortBy = req.query.sortBy as string || 'viralScore';
    const order = req.query.order as string || 'desc';

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id, userId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Valid sort fields
    const validSortFields = ['viralScore', 'duration', 'createdAt', 'title'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'viralScore';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const clips = await prisma.clip.findMany({
      where: { projectId: id },
      orderBy: { [sortField]: sortOrder },
      include: {
        analytics: {
          select: {
            platform: true,
            views: true,
            likes: true,
            shares: true,
            comments: true,
            engagement: true,
          }
        }
      }
    });

    res.json({
      success: true,
      clips: clips.map(clip => ({
        ...clip,
        totalViews: clip.analytics.reduce((sum, a) => sum + a.views, 0),
        totalLikes: clip.analytics.reduce((sum, a) => sum + a.likes, 0),
        totalShares: clip.analytics.reduce((sum, a) => sum + a.shares, 0),
        totalComments: clip.analytics.reduce((sum, a) => sum + a.comments, 0),
        avgEngagement: clip.analytics.length > 0 
          ? clip.analytics.reduce((sum, a) => sum + a.engagement, 0) / clip.analytics.length 
          : 0,
      }))
    });

  } catch (error) {
    logger.error('Get project clips error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Duplicate project
router.post('/:id/duplicate', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { id } = req.params;

    // Get original project
    const originalProject = await prisma.project.findFirst({
      where: { id, userId }
    });

    if (!originalProject) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Create duplicate project
    const duplicateProject = await prisma.project.create({
      data: {
        title: `${originalProject.title} (Copy)`,
        description: originalProject.description,
        userId,
        status: 'PROCESSING',
        originalVideoUrl: originalProject.originalVideoUrl,
        duration: originalProject.duration,
        fileSize: originalProject.fileSize,
      },
      include: {
        _count: {
          select: { clips: true }
        }
      }
    });

    logger.info('Project duplicated', { 
      userId, 
      originalProjectId: id, 
      duplicateProjectId: duplicateProject.id 
    });

    res.status(201).json({
      success: true,
      message: 'Project duplicated successfully',
      project: duplicateProject,
    });

  } catch (error) {
    logger.error('Duplicate project error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
