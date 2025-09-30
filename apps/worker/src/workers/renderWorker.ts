import { Job } from 'bullmq';
import axios from 'axios';
import { logger } from '../utils/logger.js';
import { RenderJobData } from '../queues/render.js';

export async function renderWorker(job: Job<RenderJobData>) {
  const { uploadId, segmentId, presetId } = job.data;
  
  logger.info(`Processing render job ${job.id} for segment ${segmentId}`);

  try {
    // Update job progress
    await job.updateProgress(10);

    // Step 1: Get segment and preset data
    const segmentData = await getSegmentData(segmentId);
    const presetData = await getPresetData(presetId);
    const uploadData = await getUploadData(uploadId);
    
    await job.updateProgress(30);

    // Step 2: Extract video segment
    const segmentVideoPath = await extractVideoSegment(
      uploadData.storageKey,
      segmentData.startS,
      segmentData.endS
    );
    
    await job.updateProgress(50);

    // Step 3: Generate captions
    const captionsPath = await generateCaptions(
      segmentData,
      presetData,
      segmentData.startS,
      segmentData.endS
    );
    
    await job.updateProgress(70);

    // Step 4: Render final video with captions and branding
    const renderedVideoPath = await renderFinalVideo(
      segmentVideoPath,
      captionsPath,
      presetData
    );
    
    await job.updateProgress(90);

    // Step 5: Upload to storage and update database
    const renderResult = await uploadAndSaveRender(
      renderedVideoPath,
      captionsPath,
      segmentId,
      uploadId
    );
    
    await job.updateProgress(100);

    logger.info(`Render completed for segment ${segmentId}`);
    
    return {
      segmentId,
      uploadId,
      renderResult,
    };

  } catch (error) {
    logger.error(`Render failed for segment ${segmentId}:`, error);
    throw error;
  }
}

async function getSegmentData(segmentId: string) {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL}/api/internal/segments/${segmentId}`);
  return response.data;
}

async function getPresetData(presetId: string) {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL}/api/internal/presets/${presetId}`);
  return response.data;
}

async function getUploadData(uploadId: string) {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL}/api/internal/uploads/${uploadId}`);
  return response.data;
}

async function extractVideoSegment(storageKey: string, startS: number, endS: number) {
  // Call Python service to extract video segment
  const response = await axios.post(`${process.env.PY_SERVICE_URL}/extract-segment`, {
    storageKey,
    startS,
    endS,
  });
  
  return response.data.segmentPath;
}

async function generateCaptions(segmentData: any, presetData: any, startS: number, endS: number) {
  // Call Python service to generate captions
  const response = await axios.post(`${process.env.PY_SERVICE_URL}/generate-captions`, {
    segmentData,
    presetData,
    startS,
    endS,
  });
  
  return response.data.captionsPath;
}

async function renderFinalVideo(videoPath: string, captionsPath: string, presetData: any) {
  // Call Python service for final video rendering
  const response = await axios.post(`${process.env.PY_SERVICE_URL}/render-video`, {
    videoPath,
    captionsPath,
    presetData,
  });
  
  return response.data.renderedPath;
}

async function uploadAndSaveRender(videoPath: string, captionsPath: string, segmentId: string, uploadId: string) {
  // Upload to storage and save to database
  const response = await axios.post(`${process.env.NEXT_PUBLIC_APP_URL}/api/internal/render-complete`, {
    videoPath,
    captionsPath,
    segmentId,
    uploadId,
  });
  
  return response.data;
}
