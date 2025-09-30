#!/usr/bin/env python3
"""
Mock AI Service for ReelRemix
Simulates video processing, transcription, and AI scoring
"""

import json
import time
import random
import uuid
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="ReelRemix AI Service", version="1.0.0")

# Request/Response Models
class YouTubeDownloadRequest(BaseModel):
    url: str

class StorageDownloadRequest(BaseModel):
    storageKey: str

class TranscribeRequest(BaseModel):
    videoPath: str
    uploadId: str

class SegmentRequest(BaseModel):
    transcriptResult: Dict[str, Any]
    uploadId: str

class ScoreSegmentsRequest(BaseModel):
    segments: List[Dict[str, Any]]
    transcriptResult: Dict[str, Any]

class VideoProcessingRequest(BaseModel):
    video_url: str
    title: str

# Mock data for realistic responses
SAMPLE_TRANSCRIPT_WORDS = [
    {"word": "Welcome", "start": 0.0, "end": 0.5, "confidence": 0.95},
    {"word": "to", "start": 0.5, "end": 0.7, "confidence": 0.98},
    {"word": "today's", "start": 0.7, "end": 1.2, "confidence": 0.92},
    {"word": "episode", "start": 1.2, "end": 1.8, "confidence": 0.96},
    {"word": "where", "start": 1.8, "end": 2.1, "confidence": 0.94},
    {"word": "we", "start": 2.1, "end": 2.3, "confidence": 0.99},
    {"word": "discuss", "start": 2.3, "end": 2.9, "confidence": 0.93},
    {"word": "the", "start": 2.9, "end": 3.1, "confidence": 0.97},
    {"word": "secret", "start": 3.1, "end": 3.6, "confidence": 0.91},
    {"word": "to", "start": 3.6, "end": 3.8, "confidence": 0.98},
    {"word": "viral", "start": 3.8, "end": 4.3, "confidence": 0.89},
    {"word": "content", "start": 4.3, "end": 4.9, "confidence": 0.94},
]

VIRAL_TRIGGERS = [
    "Nobody talks about this",
    "The secret that changed everything",
    "This will blow your mind",
    "What they don't want you to know",
    "The mistake everyone makes",
    "This changed my life",
    "You won't believe what happened",
    "The truth about",
    "Why everyone is wrong about",
    "The one thing that matters"
]

SCORING_REASONS = [
    "Strong emotional hook",
    "Controversial statement",
    "Surprising revelation",
    "Educational value",
    "Relatable struggle",
    "Success story",
    "Behind-the-scenes insight",
    "Expert advice",
    "Common misconception",
    "Trending topic"
]

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ReelRemix AI Service"}

@app.post("/download-youtube")
async def download_youtube(request: YouTubeDownloadRequest):
    """Simulate YouTube video download"""
    # Simulate processing time
    time.sleep(2)
    
    # Generate mock file path
    video_id = request.url.split('/')[-1].split('?')[0]
    video_path = f"/tmp/videos/{video_id}.mp4"
    
    return {
        "success": True,
        "videoPath": video_path,
        "duration": random.randint(300, 3600),  # 5-60 minutes
        "fileSize": random.randint(50000000, 500000000),  # 50MB-500MB
    }

@app.post("/download-storage")
async def download_storage(request: StorageDownloadRequest):
    """Simulate storage download"""
    time.sleep(1)
    
    video_path = f"/tmp/videos/{uuid.uuid4()}.mp4"
    
    return {
        "success": True,
        "videoPath": video_path,
        "duration": random.randint(300, 3600),
        "fileSize": random.randint(50000000, 500000000),
    }

@app.post("/transcribe")
async def transcribe_audio(request: TranscribeRequest):
    """Simulate audio transcription"""
    # Simulate processing time
    time.sleep(3)
    
    # Generate mock transcript
    transcript_id = str(uuid.uuid4())
    
    # Create realistic transcript with multiple segments
    segments = []
    current_time = 0.0
    
    for i in range(random.randint(20, 100)):  # 20-100 segments
        segment_duration = random.uniform(10, 60)  # 10-60 seconds
        segment_text = generate_realistic_segment_text()
        
        segments.append({
            "start": current_time,
            "end": current_time + segment_duration,
            "text": segment_text,
            "confidence": random.uniform(0.85, 0.99)
        })
        
        current_time += segment_duration
    
    # Generate SRT content
    srt_content = generate_srt_content(segments)
    
    # Mock storage keys
    srt_key = f"transcripts/{transcript_id}.srt"
    words_json_key = f"transcripts/{transcript_id}_words.json"
    
    return {
        "success": True,
        "id": transcript_id,
        "language": "en",
        "confidence": random.uniform(0.88, 0.96),
        "srtKey": srt_key,
        "wordsJsonKey": words_json_key,
        "segments": segments,
        "duration": current_time,
        "wordCount": len(segments) * random.randint(8, 25)
    }

@app.post("/segment")
async def generate_segments(request: SegmentRequest):
    """Generate video segments for clipping"""
    time.sleep(2)
    
    transcript_segments = request.transcriptResult.get("segments", [])
    
    # Generate 15-30 potential clips
    segments = []
    for i in range(random.randint(15, 30)):
        if i < len(transcript_segments):
            base_segment = transcript_segments[i]
            start_time = base_segment["start"]
            
            # Create clips of varying lengths (15-90 seconds)
            clip_duration = random.uniform(15, 90)
            end_time = start_time + clip_duration
            
            segments.append({
                "id": str(uuid.uuid4()),
                "startS": start_time,
                "endS": end_time,
                "duration": clip_duration,
                "text": base_segment["text"],
                "confidence": base_segment["confidence"]
            })
    
    return {
        "success": True,
        "segments": segments,
        "totalSegments": len(segments)
    }

@app.post("/score-segments")
async def score_segments(request: ScoreSegmentsRequest):
    """Score segments for viral potential using AI"""
    time.sleep(4)  # Simulate AI processing time
    
    scored_segments = []
    
    for segment in request.segments:
        # Generate realistic viral score
        base_score = random.uniform(60, 95)
        
        # Boost score for segments with viral triggers
        text = segment.get("text", "").lower()
        for trigger in VIRAL_TRIGGERS:
            if trigger.lower() in text:
                base_score += random.uniform(5, 15)
                break
        
        # Cap at 100
        viral_score = min(base_score, 100)
        
        # Generate scoring reasons
        reasons = random.sample(SCORING_REASONS, random.randint(2, 4))
        
        scored_segments.append({
            **segment,
            "score": round(viral_score, 1),
            "reasonJson": {
                "reasons": reasons,
                "confidence": random.uniform(0.8, 0.95),
                "category": random.choice(["educational", "entertainment", "inspirational", "controversial"]),
                "hooks": extract_hooks(segment.get("text", "")),
                "engagement_factors": {
                    "emotional_trigger": random.uniform(0.6, 0.9),
                    "curiosity_gap": random.uniform(0.5, 0.8),
                    "relatability": random.uniform(0.7, 0.95),
                    "shareability": random.uniform(0.6, 0.85)
                }
            }
        })
    
    # Sort by score descending
    scored_segments.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "success": True,
        "scoredSegments": scored_segments,
        "averageScore": sum(s["score"] for s in scored_segments) / len(scored_segments),
        "topScore": scored_segments[0]["score"] if scored_segments else 0
    }

@app.post("/process-video")
async def process_video_complete(request: VideoProcessingRequest):
    """Complete video processing pipeline"""
    # Simulate full processing
    time.sleep(8)
    
    # Generate mock results
    upload_id = str(uuid.uuid4())
    
    # Mock transcription
    transcript_result = {
        "id": str(uuid.uuid4()),
        "language": "en",
        "confidence": random.uniform(0.88, 0.96),
        "srtKey": f"transcripts/{upload_id}.srt",
        "wordsJsonKey": f"transcripts/{upload_id}_words.json"
    }
    
    # Mock segments with scores
    segments = []
    for i in range(random.randint(20, 40)):
        start_time = i * random.uniform(15, 45)
        duration = random.uniform(15, 90)
        
        segments.append({
            "startS": start_time,
            "endS": start_time + duration,
            "score": random.uniform(60, 98),
            "reasonJson": {
                "reasons": random.sample(SCORING_REASONS, 3),
                "confidence": random.uniform(0.8, 0.95)
            }
        })
    
    # Sort by score
    segments.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "success": True,
        "uploadId": upload_id,
        "transcriptResult": transcript_result,
        "segments": segments[:20],  # Return top 20 segments
        "processingTime": random.uniform(300, 600),  # 5-10 minutes
        "totalClips": len(segments)
    }

def generate_realistic_segment_text() -> str:
    """Generate realistic segment text"""
    templates = [
        "So here's the thing that nobody talks about when it comes to building a successful business...",
        "The biggest mistake I see entrepreneurs make is thinking that they need to have everything figured out...",
        "What I learned from failing three times before finally succeeding was that persistence isn't enough...",
        "The secret to viral content isn't what you think it is, and I'm going to prove it to you...",
        "After analyzing thousands of successful videos, I discovered this one pattern that changes everything...",
        "The reason most people fail at content creation is because they're focusing on the wrong metrics...",
        "Here's what happened when I tried this controversial marketing strategy that everyone said wouldn't work...",
        "The truth about overnight success is that it usually takes about ten years to achieve...",
    ]
    
    return random.choice(templates)

def generate_srt_content(segments: List[Dict]) -> str:
    """Generate SRT subtitle content"""
    srt_content = ""
    for i, segment in enumerate(segments, 1):
        start_time = format_srt_time(segment["start"])
        end_time = format_srt_time(segment["end"])
        
        srt_content += f"{i}\n"
        srt_content += f"{start_time} --> {end_time}\n"
        srt_content += f"{segment['text']}\n\n"
    
    return srt_content

def format_srt_time(seconds: float) -> str:
    """Format seconds to SRT time format"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millisecs = int((seconds % 1) * 1000)
    
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millisecs:03d}"

def extract_hooks(text: str) -> List[str]:
    """Extract potential hooks from text"""
    hooks = []
    text_lower = text.lower()
    
    hook_patterns = [
        "nobody talks about",
        "the secret",
        "what they don't want",
        "this will",
        "you won't believe",
        "the truth about",
        "here's what happened"
    ]
    
    for pattern in hook_patterns:
        if pattern in text_lower:
            # Extract the sentence containing the hook
            sentences = text.split('.')
            for sentence in sentences:
                if pattern in sentence.lower():
                    hooks.append(sentence.strip())
                    break
    
    return hooks[:3]  # Return up to 3 hooks

if __name__ == "__main__":
    uvicorn.run(
        "mock_service:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
