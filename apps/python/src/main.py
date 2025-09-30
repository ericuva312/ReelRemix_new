from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

from services.transcription import TranscriptionService
from services.segmentation import SegmentationService
from services.scoring import ScoringService
from services.video_processing import VideoProcessingService
from services.rendering import RenderingService
from models.requests import (
    TranscribeRequest,
    SegmentRequest,
    ScoreSegmentsRequest,
    ExtractSegmentRequest,
    GenerateCaptionsRequest,
    RenderVideoRequest,
    DownloadYouTubeRequest,
    DownloadStorageRequest
)

# Load environment variables
load_dotenv()

app = FastAPI(
    title="ReelRemix AI Processing Service",
    description="AI-powered video processing for content creation",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
transcription_service = TranscriptionService()
segmentation_service = SegmentationService()
scoring_service = ScoringService()
video_service = VideoProcessingService()
rendering_service = RenderingService()

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "reelremix-ai-processing",
        "version": "1.0.0"
    }

@app.post("/download-youtube")
async def download_youtube(request: DownloadYouTubeRequest):
    """Download video from YouTube URL"""
    try:
        video_path = await video_service.download_youtube_video(request.url)
        return {"videoPath": video_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/download-storage")
async def download_storage(request: DownloadStorageRequest):
    """Download video from object storage"""
    try:
        video_path = await video_service.download_from_storage(request.storageKey)
        return {"videoPath": video_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe")
async def transcribe_video(request: TranscribeRequest):
    """Transcribe audio from video using Whisper"""
    try:
        result = await transcription_service.transcribe(
            request.videoPath,
            request.uploadId
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/segment")
async def segment_transcript(request: SegmentRequest):
    """Generate segments from transcript"""
    try:
        segments = await segmentation_service.generate_segments(
            request.transcriptResult,
            request.uploadId
        )
        return {"segments": segments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/score-segments")
async def score_segments(request: ScoreSegmentsRequest):
    """Score segments using AI for viral potential"""
    try:
        scored_segments = await scoring_service.score_segments(
            request.segments,
            request.transcriptResult
        )
        return {"scoredSegments": scored_segments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-segment")
async def extract_segment(request: ExtractSegmentRequest):
    """Extract video segment from original video"""
    try:
        segment_path = await video_service.extract_segment(
            request.storageKey,
            request.startS,
            request.endS
        )
        return {"segmentPath": segment_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-captions")
async def generate_captions(request: GenerateCaptionsRequest):
    """Generate styled captions for video segment"""
    try:
        captions_path = await rendering_service.generate_captions(
            request.segmentData,
            request.presetData,
            request.startS,
            request.endS
        )
        return {"captionsPath": captions_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/render-video")
async def render_video(request: RenderVideoRequest):
    """Render final video with captions and branding"""
    try:
        rendered_path = await rendering_service.render_final_video(
            request.videoPath,
            request.captionsPath,
            request.presetData
        )
        return {"renderedPath": rendered_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True if os.getenv("ENV") == "development" else False
    )
