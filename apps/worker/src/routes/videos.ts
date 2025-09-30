import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { authenticateToken } from './auth.js';
import { videoProcessingQueue } from '../queues/videoProcessing.js';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const uploadVideoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  videoUrl: z.string().url('Invalid video URL'),
  duration: z.number().positive('Duration must be positive'),
  fileSize: z.number().positive('File size must be positive'),
});

const updateProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
});

// Upload video endpoint
router.post('/upload', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const validatedData = uploadVideoSchema.parse(req.body);
    
    // Check user credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, planType: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.credits < 10) {
      return res.status(402).json({
        success: false,
        error: 'Insufficient credits. You need at least 10 credits to process a video.'
      });
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        userId,
        status: 'PROCESSING',
        originalVideoUrl: validatedData.videoUrl,
        duration: validatedData.duration,
        fileSize: validatedData.fileSize,
      }
    });

    // Deduct credits
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: 10 } }
    });

    // Add to processing queue
    const job = await videoProcessingQueue.add('process-video', {
      projectId: project.id,
      userId,
      videoUrl: validatedData.videoUrl,
      title: validatedData.title,
    });

    logger.info('Video upload queued for processing', {
      userId,
      projectId: project.id,
      jobId: job.id
    });

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully and queued for processing',
      project: {
        id: project.id,
        title: project.title,
        status: project.status,
        createdAt: project.createdAt,
      },
      jobId: job.id,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    logger.error('Video upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get user's projects
router.get('/projects', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({
        where: { userId },
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
            }
          },
          _count: {
            select: { clips: true }
          }
        }
      }),
      prisma.project.count({
        where: { userId }
      })
    ]);

    res.json({
      success: true,
      projects,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
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
router.get('/projects/:id', authenticateToken, async (req: Request, res: Response) => {
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
            _count: {
              select: { analytics: true }
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

    res.json({
      success: true,
      project,
    });

  } catch (error) {
    logger.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update project
router.put('/projects/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { id } = req.params;
    const validatedData = updateProjectSchema.parse(req.body);

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        userId,
      }
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Update project
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
router.delete('/projects/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { id } = req.params;

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        userId,
      }
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Delete project (this will cascade delete clips and analytics)
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
router.get('/projects/:id/clips', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { id } = req.params;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId,
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const clips = await prisma.clip.findMany({
      where: { projectId: id },
      orderBy: { viralScore: 'desc' },
      include: {
        _count: {
          select: { analytics: true }
        }
      }
    });

    res.json({
      success: true,
      clips,
    });

  } catch (error) {
    logger.error('Get project clips error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get processing status
router.get('/processing/:jobId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const job = await videoProcessingQueue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const state = await job.getState();
    const progress = job.progress;

    res.json({
      success: true,
      job: {
        id: job.id,
        state,
        progress,
        data: job.data,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
      }
    });

  } catch (error) {
    logger.error('Get processing status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
