import { Worker } from 'bullmq';
import redis from '../utils/redis.js';
import { logger } from '../utils/logger.js';
import { videoProcessingWorker } from './videoProcessingWorker.js';
import { renderWorker } from './renderWorker.js';

export async function setupWorkers() {
  logger.info('Setting up workers...');

  // Video processing worker
  const videoWorker = new Worker('video-processing', videoProcessingWorker, {
    connection: redis,
    concurrency: 2, // Process 2 videos concurrently
  });

  videoWorker.on('completed', (job) => {
    logger.info(`Video processing job ${job.id} completed`);
  });

  videoWorker.on('failed', (job, err) => {
    logger.error(`Video processing job ${job?.id} failed:`, err);
  });

  // Render worker
  const renderWorkerInstance = new Worker('render', renderWorker, {
    connection: redis,
    concurrency: 4, // Process 4 renders concurrently
  });

  renderWorkerInstance.on('completed', (job) => {
    logger.info(`Render job ${job.id} completed`);
  });

  renderWorkerInstance.on('failed', (job, err) => {
    logger.error(`Render job ${job?.id} failed:`, err);
  });

  logger.info('Workers setup completed');
}
