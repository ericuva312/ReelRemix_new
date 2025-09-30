import { Queue } from 'bullmq';
import redis from '../utils/redis.js';

export interface VideoProcessingJobData {
  uploadId: string;
  sourceType: 'FILE' | 'YOUTUBE';
  storageKey: string;
}

export const videoProcessingQueue = new Queue<VideoProcessingJobData>('video-processing', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});
