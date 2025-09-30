import whisperx
import torch
import os
import json
import tempfile
from typing import Dict, Any, List
import librosa
import soundfile as sf

class TranscriptionService:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.compute_type = "float16" if torch.cuda.is_available() else "int8"
        
        # Load Whisper model
        self.model = whisperx.load_model("large-v2", self.device, compute_type=self.compute_type)
        
        # Load alignment model
        self.align_model = None
        self.align_metadata = None
        
    async def transcribe(self, video_path: str, upload_id: str) -> Dict[str, Any]:
        """
        Transcribe video using WhisperX for word-level timestamps
        """
        try:
            # Extract audio from video
            audio_path = await self._extract_audio(video_path)
            
            # Load audio
            audio = whisperx.load_audio(audio_path)
            
            # Transcribe with Whisper
            result = self.model.transcribe(audio, batch_size=16)
            
            # Load alignment model if not already loaded
            if self.align_model is None:
                self.align_model, self.align_metadata = whisperx.load_align_model(
                    language_code=result["language"], 
                    device=self.device
                )
            
            # Align whisper output
            result = whisperx.align(
                result["segments"], 
                self.align_model, 
                self.align_metadata, 
                audio, 
                self.device, 
                return_char_alignments=False
            )
            
            # Generate SRT content
            srt_content = self._generate_srt(result["segments"])
            
            # Prepare words JSON
            words_data = self._extract_words(result["segments"])
            
            # Calculate confidence score
            confidence = self._calculate_confidence(result["segments"])
            
            return {
                "id": f"transcript_{upload_id}",
                "uploadId": upload_id,
                "language": result.get("language", "en"),
                "srtContent": srt_content,
                "wordsData": words_data,
                "confidence": confidence,
                "segments": result["segments"],
                "duration": len(audio) / 16000  # Assuming 16kHz sample rate
            }
            
        except Exception as e:
            raise Exception(f"Transcription failed: {str(e)}")
        finally:
            # Cleanup temporary files
            if 'audio_path' in locals():
                try:
                    os.remove(audio_path)
                except:
                    pass
    
    async def _extract_audio(self, video_path: str) -> str:
        """Extract audio from video file"""
        import ffmpeg
        
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio:
            audio_path = temp_audio.name
        
        try:
            # Extract audio using ffmpeg
            (
                ffmpeg
                .input(video_path)
                .output(audio_path, acodec='pcm_s16le', ac=1, ar='16k')
                .overwrite_output()
                .run(quiet=True)
            )
            return audio_path
        except Exception as e:
            raise Exception(f"Audio extraction failed: {str(e)}")
    
    def _generate_srt(self, segments: List[Dict]) -> str:
        """Generate SRT subtitle content"""
        srt_content = ""
        
        for i, segment in enumerate(segments, 1):
            start_time = self._seconds_to_srt_time(segment['start'])
            end_time = self._seconds_to_srt_time(segment['end'])
            text = segment['text'].strip()
            
            srt_content += f"{i}\n"
            srt_content += f"{start_time} --> {end_time}\n"
            srt_content += f"{text}\n\n"
        
        return srt_content
    
    def _seconds_to_srt_time(self, seconds: float) -> str:
        """Convert seconds to SRT time format"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millisecs = int((seconds % 1) * 1000)
        
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millisecs:03d}"
    
    def _extract_words(self, segments: List[Dict]) -> List[Dict]:
        """Extract word-level data with timestamps"""
        words = []
        
        for segment in segments:
            if 'words' in segment:
                for word_data in segment['words']:
                    words.append({
                        'word': word_data.get('word', ''),
                        'start': word_data.get('start', 0),
                        'end': word_data.get('end', 0),
                        'score': word_data.get('score', 0)
                    })
        
        return words
    
    def _calculate_confidence(self, segments: List[Dict]) -> float:
        """Calculate overall confidence score"""
        total_score = 0
        word_count = 0
        
        for segment in segments:
            if 'words' in segment:
                for word in segment['words']:
                    if 'score' in word:
                        total_score += word['score']
                        word_count += 1
        
        return total_score / word_count if word_count > 0 else 0.0
