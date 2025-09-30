const express = require('express');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateVideoUpload, 
  validateIdParam, 
  validatePagination, 
  validateSearch 
} = require('../middleware/validation');
const { uploadLimiter, processingLimiter } = require('../middleware/rateLimiter');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only video files are allowed', 'INVALID_FILE_TYPE', 400), false);
    }
  }
});

// Helper function to generate upload ID
const generateUploadId = () => {
  return Math.random().toString(36).substring(2, 15);
};

// Helper function to check user credits
const checkUserCredits = async (userId, requiredCredits = 10) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true }
  });

  if (!user) {
    throw new AppError('User not found', 'USER_NOT_FOUND', 404);
  }

  if (user.credits < requiredCredits) {
    throw new AppError(
      `Insufficient credits. Required: ${requiredCredits}, Available: ${user.credits}`,
      'INSUFFICIENT_CREDITS',
      402
    );
  }

  return user.credits;
};

// Helper function to deduct credits
const deductCredits = async (userId, amount) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      credits: {
        decrement: amount
      }
    }
  });
};

// Upload video for processing
router.post('/upload',
  authenticateToken,
  uploadLimiter,
  upload.single('video'),
  validateVideoUpload,
  asyncHandler(async (req, res) => {
    const { title, description, url, projectId } = req.body;
    const file = req.file;

    // Validate input
    if (!url && !file) {
      throw new AppError('Either URL or file must be provided', 'MISSING_INPUT', 400);
    }

    // Check user credits
    await checkUserCredits(req.user.id, 10);

    // Create or get project
    let project;
    if (projectId) {
      project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: req.user.id
        }
      });

      if (!project) {
        throw new AppError('Project not found', 'PROJECT_NOT_FOUND', 404);
      }
    } else {
      // Create new project
      project = await prisma.project.create({
        data: {
          id: generateUploadId(),
          title: title || 'Untitled Project',
          description: description || '',
          userId: req.user.id,
          status: 'PROCESSING'
        }
      });
    }

    // Create upload record
    const uploadId = generateUploadId();
    const uploadData = {
      id: uploadId,
      projectId: project.id,
      title,
      description: description || '',
      status: 'QUEUED',
      sourceType: url ? 'URL' : 'FILE',
      sourceUrl: url || null,
      fileName: file ? file.originalname : null,
      fileSize: file ? file.size : null,
      mimeType: file ? file.mimetype : null
    };

    // Save to database (mock - in real app would save file to storage)
    await prisma.project.update({
      where: { id: project.id },
      data: {
        sourceUrl: url || `file://${file?.originalname}`,
        status: 'PROCESSING'
      }
    });

    // Deduct credits
    await deductCredits(req.user.id, 10);

    // In a real implementation, you would:
    // 1. Save file to cloud storage (S3, etc.)
    // 2. Add job to processing queue
    // 3. Return job ID for status tracking

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully and queued for processing',
      data: {
        uploadId,
        projectId: project.id,
        status: 'QUEUED',
        creditsDeducted: 10
      }
    });
  })
);

// Get upload/processing status
router.get('/status/:id',
  authenticateToken,
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find project by ID
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: req.user.id
      },
      include: {
        clips: {
          select: {
            id: true,
            title: true,
            duration: true,
            score: true,
            status: true
          }
        }
      }
    });

    if (!project) {
      throw new AppError('Project not found', 'PROJECT_NOT_FOUND', 404);
    }

    // Mock processing status
    let status = project.status;
    let progress = 0;
    let message = '';

    switch (status) {
      case 'PROCESSING':
        progress = Math.floor(Math.random() * 80) + 10; // 10-90%
        message = 'Analyzing video content...';
        break;
      case 'COMPLETED':
        progress = 100;
        message = 'Processing completed successfully';
        break;
      case 'FAILED':
        progress = 0;
        message = 'Processing failed';
        break;
      default:
        progress = 0;
        message = 'Queued for processing';
    }

    res.json({
      success: true,
      data: {
        id: project.id,
        status,
        progress,
        message,
        clipsGenerated: project.clips.length,
        clips: project.clips
      }
    });
  })
);

// Get user's videos/projects
router.get('/',
  authenticateToken,
  validatePagination,
  validateSearch,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', q, status } = req.query;
    
    const skip = (page - 1) * limit;
    const where = {
      userId: req.user.id,
      ...(q && {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } }
        ]
      }),
      ...(status && { status: status.toUpperCase() })
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: order },
        include: {
          clips: {
            select: {
              id: true,
              title: true,
              score: true
            }
          }
        }
      }),
      prisma.project.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  })
);

// Get specific video/project
router.get('/:id',
  authenticateToken,
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

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

    res.json({
      success: true,
      data: { project }
    });
  })
);

// Delete video/project
router.delete('/:id',
  authenticateToken,
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!project) {
      throw new AppError('Project not found', 'PROJECT_NOT_FOUND', 404);
    }

    // Delete project and associated clips
    await prisma.project.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  })
);

// Cancel processing
router.post('/:id/cancel',
  authenticateToken,
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: req.user.id,
        status: 'PROCESSING'
      }
    });

    if (!project) {
      throw new AppError('Project not found or not in processing state', 'PROJECT_NOT_FOUND', 404);
    }

    // Update status to cancelled
    await prisma.project.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    // Refund credits (partial refund for cancelled processing)
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        credits: {
          increment: 5 // Partial refund
        }
      }
    });

    res.json({
      success: true,
      message: 'Processing cancelled successfully',
      data: {
        creditsRefunded: 5
      }
    });
  })
);

module.exports = router;
