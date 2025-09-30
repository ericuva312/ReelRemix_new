from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DownloadYouTubeRequest(BaseModel):
    url: str

class DownloadStorageRequest(BaseModel):
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

class ExtractSegmentRequest(BaseModel):
    storageKey: str
    startS: float
    endS: float

class GenerateCaptionsRequest(BaseModel):
    segmentData: Dict[str, Any]
    presetData: Dict[str, Any]
    startS: float
    endS: float

class RenderVideoRequest(BaseModel):
    videoPath: str
    captionsPath: str
    presetData: Dict[str, Any]

class TranscriptResult(BaseModel):
    id: str
    uploadId: str
    language: str
    srtKey: str
    wordsJsonKey: str
    confidence: Optional[float]
    words: List[Dict[str, Any]]
    segments: List[Dict[str, Any]]

class Segment(BaseModel):
    id: str
    uploadId: str
    startS: float
    endS: float
    score: float
    reasonJson: Dict[str, Any]
    text: str
    words: List[Dict[str, Any]]

class PresetData(BaseModel):
    id: str
    name: str
    colors: Dict[str, Any]
    font: str
    frameStyle: Dict[str, Any]
