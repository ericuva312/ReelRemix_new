import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { authenticateToken } from './auth.js';
import { videoProcessingQueue } from '../queues/videoProcessing.js';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const processVideoSchema = z.object({
  projectId: z.string(),
  videoUrl: z.string().url('Invalid video URL'),
  title: z.string().min(1, 'Title is required'),
});

const processingCompleteSchema = z.object({
  uploadId: z.string(),
  transcriptResult: z.object({
    id: z.string(),
    language: z.string(),
    confidence: z.number(),
    srtKey: z.string(),
    wordsJsonKey: z.string(),
  }),
  segments: z.array(z.object({
    startS: z.number(),
    endS: z.number(),
    score: z.number(),
    reasonJson: z.any(),
  })),
});

// Start video processing
router.post('/start', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const validatedData = processVideoSchema.parse(req.body);

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        userId,
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check user credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    if (!user || user.credits < 10) {
      return res.status(402).json({
        success: false,
        error: 'Insufficient credits. You need at least 10 credits to process a video.'
      });
    }

    // Create upload record
    const upload = await prisma.upload.create({
      data: {
        projectId: validatedData.projectId,
        sourceType: validatedData.videoUrl.includes('youtube.com') || validatedData.videoUrl.includes('youtu.be') 
          ? 'YOUTUBE' 
          : 'FILE',
        storageKey: validatedData.videoUrl,
        status: 'PENDING',
      }
    });

    // Deduct credits
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: 10 } }
    });

    // Add to processing queue
    const job = await videoProcessingQueue.add('process-video', {
      uploadId: upload.id,
      projectId: validatedData.projectId,
      userId,
      videoUrl: validatedData.videoUrl,
      title: validatedData.title,
    });

    // Update project status
    await prisma.project.update({
      where: { id: validatedData.projectId },
      data: { status: 'PROCESSING' }
    });

    logger.info('Video processing started', {
      userId,
      projectId: validatedData.projectId,
      uploadId: upload.id,
      jobId: job.id
    });

    res.json({
      success: true,
      message: 'Video processing started successfully',
      uploadId: upload.id,
      jobId: job.id,
      estimatedTime: '5-10 minutes',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    logger.error('Start processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get processing status
router.get('/status/:uploadId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { uploadId } = req.params;

    // Get upload with project to verify ownership
    const upload = await prisma.upload.findFirst({
      where: {
        id: uploadId,
        project: { userId }
      },
      include: {
        project: {
          select: { title: true, userId: true }
        },
        transcripts: true,
        segments: {
          orderBy: { score: 'desc' },
          take: 10,
        }
      }
    });

    if (!upload) {
      return res.status(404).json({
        success: false,
        error: 'Upload not found'
      });
    }

    // Get job status from queue
    let jobStatus = null;
    try {
      // Find the job in the queue (this is a simplified approach)
      const jobs = await videoProcessingQueue.getJobs(['waiting', 'active', 'completed', 'failed']);
      const job = jobs.find(j => j.data.uploadId === uploadId);
      
      if (job) {
        const state = await job.getState();
        jobStatus = {
          id: job.id,
          state,
          progress: job.progress,
          processedOn: job.processedOn,
          finishedOn: job.finishedOn,
          failedReason: job.failedReason,
        };
      }
    } catch (queueError) {
      logger.warn('Failed to get job status from queue:', queueError);
    }

    res.json({
      success: true,
      upload: {
        id: upload.id,
        status: upload.status,
        sourceType: upload.sourceType,
        storageKey: upload.storageKey,
        durationS: upload.durationS,
        createdAt: upload.createdAt,
        updatedAt: upload.updatedAt,
      },
      project: upload.project,
      transcripts: upload.transcripts,
      segments: upload.segments,
      jobStatus,
    });

  } catch (error) {
    logger.error('Get processing status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Internal endpoint for processing completion (called by worker)
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const validatedData = processingCompleteSchema.parse(req.body);
    const { uploadId, transcriptResult, segments } = validatedData;

    // Update upload status
    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: 'COMPLETED' }
    });

    // Save transcript
    const transcript = await prisma.transcript.create({
      data: {
        uploadId,
        language: transcriptResult.language,
        srtKey: transcriptResult.srtKey,
        wordsJsonKey: transcriptResult.wordsJsonKey,
        confidence: transcriptResult.confidence,
      }
    });

    // Save segments
    const savedSegments = await Promise.all(
      segments.map(segment =>
        prisma.segment.create({
          data: {
            uploadId,
            startS: segment.startS,
            endS: segment.endS,
            score: segment.score,
            reasonJson: segment.reasonJson,
          }
        })
      )
    );

    // Generate clips from top segments
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
      include: { project: true }
    });

    if (upload) {
      const topSegments = savedSegments
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      const clips = await Promise.all(
        topSegments.map((segment, index) =>
          prisma.clip.create({
            data: {
              projectId: upload.projectId,
              title: `Clip ${index + 1}: ${generateClipTitle(segment)}`,
              description: generateClipDescription(segment),
              duration: segment.endS - segment.startS,
              viralScore: segment.score,
              status: 'COMPLETED',
              startTime: segment.startS,
              endTime: segment.endS,
            }
          })
        )
      );

      // Update project status
      await prisma.project.update({
        where: { id: upload.projectId },
        data: { status: 'COMPLETED' }
      });

      logger.info('Video processing completed', {
        uploadId,
        transcriptId: transcript.id,
        segmentCount: savedSegments.length,
        clipCount: clips.length,
      });
    }

    res.json({
      success: true,
      message: 'Processing completed successfully',
      transcriptId: transcript.id,
      segmentCount: savedSegments.length,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    logger.error('Processing complete error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Cancel processing
router.post('/cancel/:uploadId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { uploadId } = req.params;

    // Verify ownership
    const upload = await prisma.upload.findFirst({
      where: {
        id: uploadId,
        project: { userId }
      }
    });

    if (!upload) {
      return res.status(404).json({
        success: false,
        error: 'Upload not found'
      });
    }

    // Update status
    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: 'FAILED' }
    });

    // Try to cancel job in queue
    try {
      const jobs = await videoProcessingQueue.getJobs(['waiting', 'active']);
      const job = jobs.find(j => j.data.uploadId === uploadId);
      if (job) {
        await job.remove();
      }
    } catch (queueError) {
      logger.warn('Failed to cancel job in queue:', queueError);
    }

    // Refund credits
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: 10 } }
    });

    logger.info('Video processing cancelled', { userId, uploadId });

    res.json({
      success: true,
      message: 'Processing cancelled successfully'
    });

  } catch (error) {
    logger.error('Cancel processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Helper functions
function generateClipTitle(segment: any): string {
  const duration = Math.round(segment.endS - segment.startS);
  const score = Math.round(segment.score);
  return `${duration}s clip (Score: ${score})`;
}

function generateClipDescription(segment: any): string {
  const reasons = segment.reasonJson?.reasons || [];
  if (reasons.length > 0) {
    return `High-scoring segment: ${reasons.slice(0, 2).join(', ')}`;
  }
  return `Viral potential score: ${Math.round(segment.score)}/100`;
}

export default router;
