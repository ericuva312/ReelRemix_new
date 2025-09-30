import yt_dlp
import ffmpeg
import os
import tempfile
import asyncio
from typing import Dict, Any
import aiofiles
import requests
from urllib.parse import urlparse

class VideoProcessingService:
    def __init__(self):
        self.temp_dir = tempfile.gettempdir()
        
    async def download_youtube_video(self, url: str) -> str:
        """Download video from YouTube URL"""
        try:
            # Create temporary file for video
            temp_video = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
            temp_video.close()
            
            # Configure yt-dlp options
            ydl_opts = {
                'format': 'best[height<=1080]',  # Limit to 1080p for processing efficiency
                'outtmpl': temp_video.name,
                'noplaylist': True,
                'extract_flat': False,
            }
            
            # Download video
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                await asyncio.get_event_loop().run_in_executor(
                    None, ydl.download, [url]
                )
            
            return temp_video.name
            
        except Exception as e:
            raise Exception(f"YouTube download failed: {str(e)}")
    
    async def download_from_storage(self, storage_key: str) -> str:
        """Download video from object storage"""
        try:
            # Construct storage URL (this would be configured based on your storage provider)
            storage_url = self._construct_storage_url(storage_key)
            
            # Create temporary file
            temp_video = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
            temp_video.close()
            
            # Download file
            response = requests.get(storage_url, stream=True)
            response.raise_for_status()
            
            async with aiofiles.open(temp_video.name, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    await f.write(chunk)
            
            return temp_video.name
            
        except Exception as e:
            raise Exception(f"Storage download failed: {str(e)}")
    
    async def extract_segment(self, storage_key: str, start_s: float, end_s: float) -> str:
        """Extract a segment from the original video"""
        try:
            # Download original video
            original_path = await self.download_from_storage(storage_key)
            
            # Create temporary file for segment
            temp_segment = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
            temp_segment.close()
            
            # Extract segment using ffmpeg
            await asyncio.get_event_loop().run_in_executor(
                None, self._extract_segment_sync, original_path, temp_segment.name, start_s, end_s
            )
            
            # Clean up original file
            os.unlink(original_path)
            
            return temp_segment.name
            
        except Exception as e:
            raise Exception(f"Segment extraction failed: {str(e)}")
    
    def _extract_segment_sync(self, input_path: str, output_path: str, start_s: float, end_s: float):
        """Synchronous segment extraction using ffmpeg"""
        try:
            (
                ffmpeg
                .input(input_path, ss=start_s, t=end_s - start_s)
                .output(
                    output_path,
                    vcodec='libx264',
                    acodec='aac',
                    preset='medium',
                    crf=23
                )
                .overwrite_output()
                .run(quiet=True)
            )
        except Exception as e:
            raise Exception(f"FFmpeg segment extraction failed: {str(e)}")
    
    async def get_video_info(self, video_path: str) -> Dict[str, Any]:
        """Get video information using ffprobe"""
        try:
            probe = await asyncio.get_event_loop().run_in_executor(
                None, ffmpeg.probe, video_path
            )
            
            video_stream = next(
                (stream for stream in probe['streams'] if stream['codec_type'] == 'video'),
                None
            )
            
            audio_stream = next(
                (stream for stream in probe['streams'] if stream['codec_type'] == 'audio'),
                None
            )
            
            return {
                'duration': float(probe['format']['duration']),
                'size': int(probe['format']['size']),
                'video': {
                    'width': int(video_stream['width']) if video_stream else None,
                    'height': int(video_stream['height']) if video_stream else None,
                    'fps': eval(video_stream['r_frame_rate']) if video_stream else None,
                    'codec': video_stream['codec_name'] if video_stream else None,
                } if video_stream else None,
                'audio': {
                    'codec': audio_stream['codec_name'] if audio_stream else None,
                    'sample_rate': int(audio_stream['sample_rate']) if audio_stream else None,
                    'channels': int(audio_stream['channels']) if audio_stream else None,
                } if audio_stream else None
            }
            
        except Exception as e:
            raise Exception(f"Video info extraction failed: {str(e)}")
    
    async def convert_to_vertical(self, input_path: str, output_path: str) -> str:
        """Convert horizontal video to vertical (9:16) format"""
        try:
            # Get video info first
            info = await self.get_video_info(input_path)
            
            if not info['video']:
                raise Exception("No video stream found")
            
            width = info['video']['width']
            height = info['video']['height']
            
            # Calculate crop parameters for 9:16 aspect ratio
            target_aspect = 9 / 16
            current_aspect = width / height
            
            if current_aspect > target_aspect:
                # Video is too wide, crop horizontally
                new_width = int(height * target_aspect)
                crop_x = (width - new_width) // 2
                crop_filter = f"crop={new_width}:{height}:{crop_x}:0"
            else:
                # Video is too tall, crop vertically
                new_height = int(width / target_aspect)
                crop_y = (height - new_height) // 2
                crop_filter = f"crop={width}:{new_height}:0:{crop_y}"
            
            # Apply crop and scale to 1080x1920
            await asyncio.get_event_loop().run_in_executor(
                None, self._convert_vertical_sync, input_path, output_path, crop_filter
            )
            
            return output_path
            
        except Exception as e:
            raise Exception(f"Vertical conversion failed: {str(e)}")
    
    def _convert_vertical_sync(self, input_path: str, output_path: str, crop_filter: str):
        """Synchronous vertical conversion"""
        try:
            (
                ffmpeg
                .input(input_path)
                .filter('fps', fps=30)  # Standardize to 30fps
                .filter_complex(f"{crop_filter},scale=1080:1920")
                .output(
                    output_path,
                    vcodec='libx264',
                    acodec='aac',
                    preset='medium',
                    crf=20,
                    pix_fmt='yuv420p'
                )
                .overwrite_output()
                .run(quiet=True)
            )
        except Exception as e:
            raise Exception(f"FFmpeg vertical conversion failed: {str(e)}")
    
    def _construct_storage_url(self, storage_key: str) -> str:
        """Construct URL for storage access"""
        # This would be configured based on your storage provider
        # For example, with Cloudflare R2 or AWS S3
        base_url = os.getenv('R2_PUBLIC_URL', 'https://your-bucket.r2.cloudflarestorage.com')
        return f"{base_url}/{storage_key}"
    
    async def cleanup_temp_file(self, file_path: str):
        """Clean up temporary files"""
        try:
            if os.path.exists(file_path):
                os.unlink(file_path)
        except Exception as e:
            print(f"Failed to cleanup temp file {file_path}: {e}")
