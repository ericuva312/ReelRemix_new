import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { ExpressAdapter } from '@bull-board/express';
import { PrismaClient } from '@prisma/client';

import { logger } from './utils/logger.js';
import { videoProcessingQueue } from './queues/videoProcessing.js';
import { renderQueue } from './queues/render.js';
import { setupWorkers } from './workers/index.js';

// Routes
import authRoutes from './routes/auth.js';
import videoRoutes from './routes/videos.js';
import processingRoutes from './routes/processing.js';
import dashboardRoutes from './routes/dashboard.js';
import projectRoutes from './routes/projects.js';
import billingRoutes from './routes/billing.js';
import analyticsRoutes from './routes/analytics.js';

// Services
import MonitoringService from './services/monitoring.js';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Raw body for webhooks
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

// Bull Board for queue monitoring
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(videoProcessingQueue),
    new BullMQAdapter(renderQueue),
  ],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Basic health check
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      queues: {
        videoProcessing: videoProcessingQueue.name,
        render: renderQueue.name,
      }
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// API endpoints
app.post('/api/jobs/video-processing', async (req, res) => {
  try {
    const { uploadId, sourceType, storageKey } = req.body;
    
    const job = await videoProcessingQueue.add('process-video', {
      uploadId,
      sourceType,
      storageKey,
    });

    res.json({ jobId: job.id, status: 'queued' });
  } catch (error) {
    logger.error('Failed to queue video processing job:', error);
    res.status(500).json({ error: 'Failed to queue job' });
  }
});

app.post('/api/jobs/render', async (req, res) => {
  try {
    const { uploadId, segmentIds, presetId } = req.body;
    
    const jobs = await Promise.all(
      segmentIds.map((segmentId: string) =>
        renderQueue.add('render-clip', {
          uploadId,
          segmentId,
          presetId,
        })
      )
    );

    res.json({ 
      renderIds: jobs.map(job => job.id),
      status: 'queued' 
    });
  } catch (error) {
    logger.error('Failed to queue render jobs:', error);
    res.status(500).json({ error: 'Failed to queue jobs' });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/processing', processingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server and workers
async function start() {
  try {
    // Connect to database
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Setup workers
    await setupWorkers();
    
    // Start monitoring
    MonitoringService.startMonitoring();
    logger.info('Monitoring service started');
    
    app.listen(PORT, () => {
      logger.info(`Worker service started on port ${PORT}`);
      logger.info(`Queue dashboard available at http://localhost:${PORT}/admin/queues`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start worker service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

start();
