import ffmpeg
import os
import tempfile
import asyncio
import json
from typing import Dict, Any, List
from PIL import Image, ImageDraw, ImageFont
import textwrap
import math

class RenderingService:
    def __init__(self):
        self.temp_dir = tempfile.gettempdir()
        self.fonts_dir = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fonts')
        self.default_font_path = self._get_default_font()
        
    def _get_default_font(self) -> str:
        """Get default font path"""
        # Try to find system fonts or use a default
        possible_fonts = [
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            '/System/Library/Fonts/Arial.ttf',
            '/Windows/Fonts/arial.ttf'
        ]
        
        for font_path in possible_fonts:
            if os.path.exists(font_path):
                return font_path
        
        # Fallback to PIL default
        return None
    
    async def generate_captions(self, segment_data: Dict[str, Any], preset_data: Dict[str, Any], 
                              start_s: float, end_s: float) -> str:
        """Generate styled captions for video segment"""
        try:
            # Extract words for the segment timeframe
            words = self._extract_segment_words(segment_data, start_s, end_s)
            
            # Generate caption frames
            caption_frames = self._generate_caption_frames(words, preset_data, end_s - start_s)
            
            # Create video from caption frames
            captions_video_path = await self._create_captions_video(caption_frames, end_s - start_s)
            
            return captions_video_path
            
        except Exception as e:
            raise Exception(f"Caption generation failed: {str(e)}")
    
    def _extract_segment_words(self, segment_data: Dict[str, Any], start_s: float, end_s: float) -> List[Dict]:
        """Extract words that fall within the segment timeframe"""
        words = segment_data.get('words', [])
        segment_words = []
        
        for word in words:
            word_start = word.get('start', 0)
            word_end = word.get('end', 0)
            
            # Check if word overlaps with segment
            if word_start < end_s and word_end > start_s:
                # Adjust timing relative to segment start
                adjusted_word = word.copy()
                adjusted_word['start'] = max(0, word_start - start_s)
                adjusted_word['end'] = min(end_s - start_s, word_end - start_s)
                segment_words.append(adjusted_word)
        
        return segment_words
    
    def _generate_caption_frames(self, words: List[Dict], preset_data: Dict[str, Any], duration: float) -> List[Dict]:
        """Generate caption frames with styling"""
        frames = []
        fps = 30
        total_frames = int(duration * fps)
        
        # Get preset styling
        colors = preset_data.get('colors', {})
        font_name = preset_data.get('font', 'Arial')
        frame_style = preset_data.get('frameStyle', {})
        
        # Caption styling parameters
        caption_style = {
            'font_size': frame_style.get('fontSize', 48),
            'font_color': colors.get('text', '#FFFFFF'),
            'background_color': colors.get('background', '#000000'),
            'stroke_color': colors.get('stroke', '#000000'),
            'stroke_width': frame_style.get('strokeWidth', 3),
            'max_chars_per_line': frame_style.get('maxCharsPerLine', 16),
            'max_lines': frame_style.get('maxLines', 2),
            'highlight_color': colors.get('highlight', '#FFD700')
        }
        
        # Group words into caption chunks
        caption_chunks = self._group_words_into_chunks(words, caption_style)
        
        # Generate frames
        for frame_num in range(total_frames):
            frame_time = frame_num / fps
            
            # Find active caption chunk
            active_chunk = None
            highlighted_words = []
            
            for chunk in caption_chunks:
                if chunk['start'] <= frame_time <= chunk['end']:
                    active_chunk = chunk
                    
                    # Find words to highlight at this time
                    for word in chunk['words']:
                        if word['start'] <= frame_time <= word['end']:
                            highlighted_words.append(word['word'])
                    break
            
            frame_data = {
                'frame_number': frame_num,
                'time': frame_time,
                'text': active_chunk['text'] if active_chunk else '',
                'highlighted_words': highlighted_words,
                'style': caption_style
            }
            
            frames.append(frame_data)
        
        return frames
    
    def _group_words_into_chunks(self, words: List[Dict], style: Dict[str, Any]) -> List[Dict]:
        """Group words into caption chunks based on timing and length constraints"""
        chunks = []
        current_chunk = {'words': [], 'text': '', 'start': 0, 'end': 0}
        
        max_chars = style['max_chars_per_line'] * style['max_lines']
        
        for word in words:
            word_text = word.get('word', '').strip()
            
            # Check if adding this word would exceed limits
            test_text = current_chunk['text'] + ' ' + word_text if current_chunk['text'] else word_text
            
            if len(test_text) > max_chars and current_chunk['words']:
                # Finalize current chunk
                current_chunk['end'] = current_chunk['words'][-1]['end']
                chunks.append(current_chunk)
                
                # Start new chunk
                current_chunk = {
                    'words': [word],
                    'text': word_text,
                    'start': word['start']
                }
            else:
                # Add word to current chunk
                current_chunk['words'].append(word)
                current_chunk['text'] = test_text
                if not current_chunk.get('start'):
                    current_chunk['start'] = word['start']
        
        # Add final chunk
        if current_chunk['words']:
            current_chunk['end'] = current_chunk['words'][-1]['end']
            chunks.append(current_chunk)
        
        return chunks
    
    async def _create_captions_video(self, frames: List[Dict], duration: float) -> str:
        """Create video from caption frames"""
        try:
            # Create temporary directory for frames
            frames_dir = tempfile.mkdtemp()
            
            # Generate image frames
            for frame in frames:
                frame_path = os.path.join(frames_dir, f"frame_{frame['frame_number']:06d}.png")
                await self._create_caption_frame_image(frame, frame_path)
            
            # Create video from frames
            temp_video = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
            temp_video.close()
            
            await asyncio.get_event_loop().run_in_executor(
                None, self._create_video_from_frames, frames_dir, temp_video.name, duration
            )
            
            # Cleanup frame images
            import shutil
            shutil.rmtree(frames_dir)
            
            return temp_video.name
            
        except Exception as e:
            raise Exception(f"Caption video creation failed: {str(e)}")
    
    async def _create_caption_frame_image(self, frame: Dict[str, Any], output_path: str):
        """Create a single caption frame image"""
        try:
            # Create transparent image (1080x1920 for vertical video)
            img = Image.new('RGBA', (1080, 1920), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)
            
            if not frame['text']:
                # Save empty frame
                img.save(output_path, 'PNG')
                return
            
            style = frame['style']
            
            # Load font
            try:
                font = ImageFont.truetype(self.default_font_path, style['font_size'])
            except:
                font = ImageFont.load_default()
            
            # Wrap text
            wrapped_text = self._wrap_text(frame['text'], style['max_chars_per_line'])
            lines = wrapped_text.split('\n')[:style['max_lines']]
            
            # Calculate text position (bottom third of screen)
            text_height = len(lines) * (style['font_size'] + 10)
            y_start = 1920 - 300 - text_height  # 300px from bottom
            
            # Draw each line
            for i, line in enumerate(lines):
                y_pos = y_start + i * (style['font_size'] + 10)
                
                # Calculate x position for centering
                bbox = draw.textbbox((0, 0), line, font=font)
                text_width = bbox[2] - bbox[0]
                x_pos = (1080 - text_width) // 2
                
                # Draw text with stroke
                if style['stroke_width'] > 0:
                    # Draw stroke
                    for dx in range(-style['stroke_width'], style['stroke_width'] + 1):
                        for dy in range(-style['stroke_width'], style['stroke_width'] + 1):
                            if dx != 0 or dy != 0:
                                draw.text((x_pos + dx, y_pos + dy), line, 
                                        font=font, fill=style['stroke_color'])
                
                # Draw main text
                draw.text((x_pos, y_pos), line, font=font, fill=style['font_color'])
                
                # Highlight active words
                if frame['highlighted_words']:
                    self._highlight_words(draw, line, frame['highlighted_words'], 
                                        x_pos, y_pos, font, style)
            
            # Save frame
            img.save(output_path, 'PNG')
            
        except Exception as e:
            raise Exception(f"Frame image creation failed: {str(e)}")
    
    def _wrap_text(self, text: str, max_chars_per_line: int) -> str:
        """Wrap text to fit within character limits"""
        words = text.split()
        lines = []
        current_line = []
        current_length = 0
        
        for word in words:
            if current_length + len(word) + 1 <= max_chars_per_line:
                current_line.append(word)
                current_length += len(word) + 1
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]
                current_length = len(word)
        
        if current_line:
            lines.append(' '.join(current_line))
        
        return '\n'.join(lines)
    
    def _highlight_words(self, draw, line: str, highlighted_words: List[str], 
                        x_pos: int, y_pos: int, font, style: Dict[str, Any]):
        """Highlight specific words in the line"""
        # This is a simplified implementation
        # In a production system, you'd want more sophisticated word highlighting
        pass
    
    def _create_video_from_frames(self, frames_dir: str, output_path: str, duration: float):
        """Create video from frame images using ffmpeg"""
        try:
            (
                ffmpeg
                .input(os.path.join(frames_dir, 'frame_%06d.png'), framerate=30)
                .output(
                    output_path,
                    vcodec='libx264',
                    pix_fmt='yuv420p',
                    t=duration
                )
                .overwrite_output()
                .run(quiet=True)
            )
        except Exception as e:
            raise Exception(f"FFmpeg frame compilation failed: {str(e)}")
    
    async def render_final_video(self, video_path: str, captions_path: str, 
                               preset_data: Dict[str, Any]) -> str:
        """Render final video with captions and branding"""
        try:
            # Create temporary file for output
            temp_output = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
            temp_output.close()
            
            # Get preset styling
            frame_style = preset_data.get('frameStyle', {})
            colors = preset_data.get('colors', {})
            
            # Build ffmpeg filter complex
            filters = []
            
            # Add branding elements if specified
            if frame_style.get('logo'):
                filters.append(self._create_logo_filter(frame_style))
            
            if frame_style.get('progressBar'):
                filters.append(self._create_progress_bar_filter(frame_style, colors))
            
            if frame_style.get('titleCard'):
                filters.append(self._create_title_card_filter(frame_style, colors))
            
            # Combine video with captions
            await asyncio.get_event_loop().run_in_executor(
                None, self._render_final_sync, video_path, captions_path, 
                temp_output.name, filters
            )
            
            return temp_output.name
            
        except Exception as e:
            raise Exception(f"Final rendering failed: {str(e)}")
    
    def _create_logo_filter(self, frame_style: Dict[str, Any]) -> str:
        """Create logo overlay filter"""
        logo_config = frame_style.get('logo', {})
        position = logo_config.get('position', 'top-right')
        size = logo_config.get('size', 100)
        
        # Position mapping
        positions = {
            'top-left': '10:10',
            'top-right': 'W-w-10:10',
            'bottom-left': '10:H-h-10',
            'bottom-right': 'W-w-10:H-h-10'
        }
        
        pos = positions.get(position, 'W-w-10:10')
        return f"overlay={pos}"
    
    def _create_progress_bar_filter(self, frame_style: Dict[str, Any], colors: Dict[str, Any]) -> str:
        """Create progress bar filter"""
        # Simplified progress bar implementation
        return "drawbox=x=0:y=H-5:w=W*t/duration:h=5:color=white@0.8"
    
    def _create_title_card_filter(self, frame_style: Dict[str, Any], colors: Dict[str, Any]) -> str:
        """Create title card filter"""
        # Simplified title card implementation
        return "fade=t=in:st=0:d=1"
    
    def _render_final_sync(self, video_path: str, captions_path: str, 
                          output_path: str, filters: List[str]):
        """Synchronous final rendering"""
        try:
            # Basic composition: overlay captions on video
            input_video = ffmpeg.input(video_path)
            input_captions = ffmpeg.input(captions_path)
            
            # Overlay captions on video
            output = ffmpeg.overlay(input_video, input_captions)
            
            # Apply additional filters if any
            for filter_str in filters:
                # This would need more sophisticated filter application
                pass
            
            # Output with high quality settings
            output = ffmpeg.output(
                output,
                output_path,
                vcodec='libx264',
                acodec='aac',
                preset='medium',
                crf=20,
                pix_fmt='yuv420p',
                movflags='faststart'
            )
            
            ffmpeg.run(output, overwrite_output=True, quiet=True)
            
        except Exception as e:
            raise Exception(f"FFmpeg final rendering failed: {str(e)}")
    
    async def cleanup_temp_files(self, *file_paths: str):
        """Clean up temporary files"""
        for file_path in file_paths:
            try:
                if os.path.exists(file_path):
                    os.unlink(file_path)
            except Exception as e:
                print(f"Failed to cleanup temp file {file_path}: {e}")
