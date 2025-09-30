import { Job } from 'bullmq';
import axios from 'axios';
import { logger } from '../utils/logger.js';
import { VideoProcessingJobData } from '../queues/videoProcessing.js';

export async function videoProcessingWorker(job: Job<VideoProcessingJobData>) {
  const { uploadId, sourceType, storageKey } = job.data;
  
  logger.info(`Processing video job ${job.id} for upload ${uploadId}`);

  try {
    // Update job progress
    await job.updateProgress(10);

    // Step 1: Download/fetch video
    let videoPath: string;
    if (sourceType === 'YOUTUBE') {
      videoPath = await fetchYouTubeVideo(storageKey);
    } else {
      videoPath = await downloadFromStorage(storageKey);
    }
    
    await job.updateProgress(30);

    // Step 2: Extract audio and transcribe
    const transcriptResult = await transcribeAudio(videoPath, uploadId);
    
    await job.updateProgress(60);

    // Step 3: Generate segments
    const segments = await generateSegments(transcriptResult, uploadId);
    
    await job.updateProgress(80);

    // Step 4: Score segments with AI
    const scoredSegments = await scoreSegments(segments, transcriptResult);
    
    await job.updateProgress(90);

    // Step 5: Save results to database
    await saveProcessingResults(uploadId, transcriptResult, scoredSegments);
    
    await job.updateProgress(100);

    logger.info(`Video processing completed for upload ${uploadId}`);
    
    return {
      uploadId,
      transcriptId: transcriptResult.id,
      segmentCount: scoredSegments.length,
      topSegments: scoredSegments.slice(0, 10),
    };

  } catch (error) {
    logger.error(`Video processing failed for upload ${uploadId}:`, error);
    throw error;
  }
}

async function fetchYouTubeVideo(youtubeUrl: string): Promise<string> {
  // Call Python service to download YouTube video
  const response = await axios.post(`${process.env.PY_SERVICE_URL}/download-youtube`, {
    url: youtubeUrl,
  });
  
  return response.data.videoPath;
}

async function downloadFromStorage(storageKey: string): Promise<string> {
  // Download video from object storage
  // Implementation depends on storage provider (S3/R2)
  const response = await axios.post(`${process.env.PY_SERVICE_URL}/download-storage`, {
    storageKey,
  });
  
  return response.data.videoPath;
}

async function transcribeAudio(videoPath: string, uploadId: string) {
  // Call Python service for transcription
  const response = await axios.post(`${process.env.PY_SERVICE_URL}/transcribe`, {
    videoPath,
    uploadId,
  });
  
  return response.data;
}

async function generateSegments(transcriptResult: any, uploadId: string) {
  // Call Python service for segmentation
  const response = await axios.post(`${process.env.PY_SERVICE_URL}/segment`, {
    transcriptResult,
    uploadId,
  });
  
  return response.data.segments;
}

async function scoreSegments(segments: any[], transcriptResult: any) {
  // Call Python service for AI scoring
  const response = await axios.post(`${process.env.PY_SERVICE_URL}/score-segments`, {
    segments,
    transcriptResult,
  });
  
  return response.data.scoredSegments;
}

async function saveProcessingResults(uploadId: string, transcriptResult: any, segments: any[]) {
  // Save results to database via web API
  await axios.post(`${process.env.NEXT_PUBLIC_APP_URL}/api/internal/processing-complete`, {
    uploadId,
    transcriptResult,
    segments,
  });
}
