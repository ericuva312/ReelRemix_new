import { Queue } from 'bullmq';
import redis from '../utils/redis.js';

export interface RenderJobData {
  uploadId: string;
  segmentId: string;
  presetId: string;
}

export const renderQueue = new Queue<RenderJobData>('render', {
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
