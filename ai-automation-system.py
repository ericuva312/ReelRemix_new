#!/usr/bin/env python3
"""
ReelRemix AI Video Processing Automation System
Automates the complete video-to-clips pipeline using AI services
"""

import os
import json
import subprocess
import requests
from pathlib import Path
from typing import List, Dict, Tuple
import openai
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip
import whisper
import cv2
import numpy as np
from datetime import datetime, timedelta

class ReelRemixAI:
    def __init__(self):
        """Initialize the AI processing system with API keys and configurations"""
        self.openai_client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.whisper_model = whisper.load_model("base")
        
        # Platform specifications
        self.platform_specs = {
            'instagram': {'width': 1080, 'height': 1920, 'max_duration': 60},
            'tiktok': {'width': 1080, 'height': 1920, 'max_duration': 60},
            'youtube_shorts': {'width': 1080, 'height': 1920, 'max_duration': 60},
            'twitter': {'width': 1280, 'height': 720, 'max_duration': 140},
            'linkedin': {'width': 1280, 'height': 720, 'max_duration': 600}
        }
        
        # Engagement scoring weights
        self.scoring_weights = {
            'hook_strength': 0.3,
            'emotional_impact': 0.25,
            'information_density': 0.2,
            'visual_appeal': 0.15,
            'call_to_action': 0.1
        }

    def process_video_complete(self, video_path: str, output_dir: str) -> Dict:
        """
        Complete video processing pipeline
        Returns: Dictionary with clips, analytics, and metadata
        """
        print(f"🎬 Starting AI processing for: {video_path}")
        
        # Step 1: Extract audio and transcribe
        transcript = self.transcribe_video(video_path)
        
        # Step 2: Analyze content for engaging moments
        segments = self.identify_engaging_segments(transcript, video_path)
        
        # Step 3: Create clips with captions
        clips = self.create_clips_with_captions(video_path, segments, output_dir)
        
        # Step 4: Generate multiple platform formats
        platform_clips = self.export_platform_formats(clips, output_dir)
        
        # Step 5: Generate performance predictions
        analytics = self.generate_performance_analytics(clips, transcript)
        
        return {
            'clips': platform_clips,
            'analytics': analytics,
            'transcript': transcript,
            'processing_time': datetime.now().isoformat(),
            'total_clips': len(clips)
        }

    def transcribe_video(self, video_path: str) -> Dict:
        """Extract audio and create detailed transcript with timestamps"""
        print("🎤 Transcribing audio...")
        
        # Extract audio using moviepy
        video = VideoFileClip(video_path)
        audio_path = video_path.replace('.mp4', '_audio.wav')
        video.audio.write_audiofile(audio_path, verbose=False, logger=None)
        
        # Transcribe with Whisper
        result = self.whisper_model.transcribe(audio_path, word_timestamps=True)
        
        # Clean up temporary audio file
        os.remove(audio_path)
        
        # Structure transcript with detailed timing
        structured_transcript = {
            'full_text': result['text'],
            'segments': [],
            'duration': video.duration
        }
        
        for segment in result['segments']:
            structured_transcript['segments'].append({
                'start': segment['start'],
                'end': segment['end'],
                'text': segment['text'].strip(),
                'words': segment.get('words', [])
            })
        
        video.close()
        return structured_transcript

    def identify_engaging_segments(self, transcript: Dict, video_path: str) -> List[Dict]:
        """Use AI to identify the most engaging moments in the video"""
        print("🧠 Analyzing content for engaging moments...")
        
        # Prepare content for AI analysis
        full_text = transcript['full_text']
        segments_text = [seg['text'] for seg in transcript['segments']]
        
        # AI prompt for engagement analysis
        prompt = f"""
        Analyze this video transcript and identify 5-8 of the most engaging 30-60 second segments that would make viral social media clips.

        Full transcript: {full_text}

        For each segment, provide:
        1. Start and end timestamps (in seconds)
        2. Hook strength (1-10)
        3. Emotional impact (1-10) 
        4. Information value (1-10)
        5. Viral potential score (1-100)
        6. Suggested title
        7. Key message
        8. Target platform (Instagram, TikTok, YouTube Shorts)

        Focus on:
        - Strong opening hooks
        - Emotional moments
        - Surprising insights
        - Actionable advice
        - Controversial or debate-worthy statements
        - Before/after transformations
        - Personal stories

        Return as JSON array with this structure:
        [{{
            "start_time": 45.2,
            "end_time": 98.7,
            "hook_strength": 9,
            "emotional_impact": 8,
            "information_value": 7,
            "viral_score": 87,
            "title": "The Mistake That Cost Me $50K",
            "key_message": "Why rushing decisions in business always backfires",
            "platform": "instagram",
            "reasoning": "Strong emotional hook with specific dollar amount, relatable business mistake"
        }}]
        """
        
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            
            # Parse AI response
            ai_segments = json.loads(response.choices[0].message.content)
            
            # Validate and adjust timestamps based on actual transcript
            validated_segments = self.validate_segments(ai_segments, transcript)
            
            return validated_segments
            
        except Exception as e:
            print(f"❌ AI analysis failed: {e}")
            # Fallback: Create segments based on transcript timing
            return self.create_fallback_segments(transcript)

    def validate_segments(self, ai_segments: List[Dict], transcript: Dict) -> List[Dict]:
        """Validate AI-suggested segments against actual transcript timing"""
        validated = []
        
        for segment in ai_segments:
            # Find closest transcript segments
            start_time = segment['start_time']
            end_time = segment['end_time']
            
            # Adjust to transcript boundaries
            adjusted_start = self.find_nearest_sentence_start(start_time, transcript)
            adjusted_end = self.find_nearest_sentence_end(end_time, transcript)
            
            # Ensure minimum 20 seconds, maximum 90 seconds
            duration = adjusted_end - adjusted_start
            if duration < 20:
                adjusted_end = min(adjusted_start + 30, transcript['duration'])
            elif duration > 90:
                adjusted_end = adjusted_start + 60
            
            segment['start_time'] = adjusted_start
            segment['end_time'] = adjusted_end
            segment['duration'] = adjusted_end - adjusted_start
            
            validated.append(segment)
        
        return validated

    def find_nearest_sentence_start(self, target_time: float, transcript: Dict) -> float:
        """Find the nearest sentence start to avoid cutting mid-sentence"""
        for segment in transcript['segments']:
            if segment['start'] <= target_time <= segment['end']:
                return segment['start']
        return target_time

    def find_nearest_sentence_end(self, target_time: float, transcript: Dict) -> float:
        """Find the nearest sentence end to avoid cutting mid-sentence"""
        for segment in transcript['segments']:
            if segment['start'] <= target_time <= segment['end']:
                return segment['end']
        return target_time

    def create_clips_with_captions(self, video_path: str, segments: List[Dict], output_dir: str) -> List[Dict]:
        """Create video clips with auto-generated captions"""
        print("✂️ Creating clips with captions...")
        
        clips = []
        video = VideoFileClip(video_path)
        
        for i, segment in enumerate(segments):
            try:
                # Extract clip
                clip = video.subclip(segment['start_time'], segment['end_time'])
                
                # Generate captions for this segment
                captions = self.generate_captions_for_segment(segment, video_path)
                
                # Add captions to video
                captioned_clip = self.add_captions_to_clip(clip, captions)
                
                # Save clip
                clip_filename = f"clip_{i+1}_{segment['title'].replace(' ', '_')[:20]}.mp4"
                clip_path = os.path.join(output_dir, clip_filename)
                
                captioned_clip.write_videofile(
                    clip_path,
                    codec='libx264',
                    audio_codec='aac',
                    verbose=False,
                    logger=None
                )
                
                clips.append({
                    'id': f"clip_{i+1}",
                    'path': clip_path,
                    'filename': clip_filename,
                    'title': segment['title'],
                    'duration': segment['duration'],
                    'viral_score': segment['viral_score'],
                    'platform': segment['platform'],
                    'start_time': segment['start_time'],
                    'end_time': segment['end_time'],
                    'captions': captions
                })
                
                clip.close()
                captioned_clip.close()
                
            except Exception as e:
                print(f"❌ Failed to create clip {i+1}: {e}")
                continue
        
        video.close()
        return clips

    def generate_captions_for_segment(self, segment: Dict, video_path: str) -> List[Dict]:
        """Generate word-level captions for a video segment"""
        # Extract audio for this specific segment
        video = VideoFileClip(video_path)
        segment_clip = video.subclip(segment['start_time'], segment['end_time'])
        
        # Create temporary audio file
        temp_audio = f"temp_segment_{segment['start_time']}.wav"
        segment_clip.audio.write_audiofile(temp_audio, verbose=False, logger=None)
        
        # Transcribe with word-level timestamps
        result = self.whisper_model.transcribe(temp_audio, word_timestamps=True)
        
        # Clean up
        os.remove(temp_audio)
        video.close()
        segment_clip.close()
        
        # Format captions
        captions = []
        for segment_data in result['segments']:
            for word_data in segment_data.get('words', []):
                captions.append({
                    'start': word_data['start'],
                    'end': word_data['end'],
                    'text': word_data['word'].strip(),
                    'confidence': word_data.get('probability', 0.9)
                })
        
        return captions

    def add_captions_to_clip(self, clip: VideoFileClip, captions: List[Dict]) -> CompositeVideoClip:
        """Add animated captions to video clip"""
        caption_clips = []
        
        # Group words into phrases (2-4 words per caption)
        phrases = self.group_words_into_phrases(captions)
        
        for phrase in phrases:
            # Create text clip
            txt_clip = TextClip(
                phrase['text'],
                fontsize=60,
                color='white',
                stroke_color='black',
                stroke_width=2,
                font='Arial-Bold'
            ).set_position(('center', 'bottom')).set_start(phrase['start']).set_duration(phrase['duration'])
            
            caption_clips.append(txt_clip)
        
        # Composite video with captions
        return CompositeVideoClip([clip] + caption_clips)

    def group_words_into_phrases(self, captions: List[Dict]) -> List[Dict]:
        """Group individual words into readable phrases"""
        phrases = []
        current_phrase = []
        phrase_start = None
        
        for caption in captions:
            if not current_phrase:
                phrase_start = caption['start']
            
            current_phrase.append(caption['text'])
            
            # Create phrase every 2-4 words or at natural breaks
            if len(current_phrase) >= 3 or caption['text'].endswith(('.', '!', '?', ',')):
                phrase_text = ' '.join(current_phrase).strip()
                phrase_end = caption['end']
                
                phrases.append({
                    'text': phrase_text,
                    'start': phrase_start,
                    'end': phrase_end,
                    'duration': phrase_end - phrase_start
                })
                
                current_phrase = []
                phrase_start = None
        
        # Handle remaining words
        if current_phrase:
            phrase_text = ' '.join(current_phrase).strip()
            phrases.append({
                'text': phrase_text,
                'start': phrase_start,
                'end': captions[-1]['end'],
                'duration': captions[-1]['end'] - phrase_start
            })
        
        return phrases

    def export_platform_formats(self, clips: List[Dict], output_dir: str) -> Dict:
        """Export clips in multiple platform-specific formats"""
        print("📱 Exporting platform-specific formats...")
        
        platform_clips = {}
        
        for clip_data in clips:
            clip_path = clip_data['path']
            clip_name = clip_data['filename'].replace('.mp4', '')
            
            platform_clips[clip_data['id']] = {}
            
            for platform, specs in self.platform_specs.items():
                try:
                    # Load original clip
                    clip = VideoFileClip(clip_path)
                    
                    # Resize for platform
                    if platform in ['instagram', 'tiktok', 'youtube_shorts']:
                        # Vertical format (9:16)
                        resized_clip = self.resize_for_vertical(clip, specs['width'], specs['height'])
                    else:
                        # Horizontal format (16:9)
                        resized_clip = clip.resize(height=specs['height'])
                    
                    # Trim to platform duration limit
                    if clip.duration > specs['max_duration']:
                        resized_clip = resized_clip.subclip(0, specs['max_duration'])
                    
                    # Export
                    platform_filename = f"{clip_name}_{platform}.mp4"
                    platform_path = os.path.join(output_dir, platform_filename)
                    
                    resized_clip.write_videofile(
                        platform_path,
                        codec='libx264',
                        audio_codec='aac',
                        verbose=False,
                        logger=None
                    )
                    
                    platform_clips[clip_data['id']][platform] = {
                        'path': platform_path,
                        'filename': platform_filename,
                        'width': specs['width'],
                        'height': specs['height'],
                        'duration': resized_clip.duration
                    }
                    
                    clip.close()
                    resized_clip.close()
                    
                except Exception as e:
                    print(f"❌ Failed to export {clip_data['id']} for {platform}: {e}")
                    continue
        
        return platform_clips

    def resize_for_vertical(self, clip: VideoFileClip, target_width: int, target_height: int) -> VideoFileClip:
        """Resize video for vertical platforms (9:16 aspect ratio)"""
        # Calculate scaling to fit height
        scale_factor = target_height / clip.h
        
        # Resize maintaining aspect ratio
        resized = clip.resize(scale_factor)
        
        # If width is too wide, crop from center
        if resized.w > target_width:
            x_center = resized.w / 2
            x_start = x_center - (target_width / 2)
            resized = resized.crop(x1=x_start, x2=x_start + target_width)
        
        return resized

    def generate_performance_analytics(self, clips: List[Dict], transcript: Dict) -> Dict:
        """Generate AI-powered performance predictions and analytics"""
        print("📊 Generating performance analytics...")
        
        analytics = {
            'overall_score': 0,
            'clip_analytics': [],
            'recommendations': [],
            'trending_topics': [],
            'optimal_posting_times': {}
        }
        
        total_score = 0
        
        for clip in clips:
            # Analyze clip content
            clip_analytics = self.analyze_clip_performance(clip, transcript)
            analytics['clip_analytics'].append(clip_analytics)
            total_score += clip_analytics['predicted_score']
        
        analytics['overall_score'] = total_score / len(clips) if clips else 0
        
        # Generate recommendations
        analytics['recommendations'] = self.generate_content_recommendations(clips, transcript)
        
        # Identify trending topics
        analytics['trending_topics'] = self.identify_trending_topics(transcript)
        
        # Suggest optimal posting times
        analytics['optimal_posting_times'] = self.suggest_posting_times(clips)
        
        return analytics

    def analyze_clip_performance(self, clip: Dict, transcript: Dict) -> Dict:
        """Analyze individual clip for performance prediction"""
        # Use AI to analyze content elements
        prompt = f"""
        Analyze this video clip for social media performance prediction:
        
        Title: {clip['title']}
        Duration: {clip['duration']} seconds
        Platform: {clip['platform']}
        
        Predict performance metrics and provide insights:
        1. Estimated view count range
        2. Engagement rate prediction
        3. Viral potential (1-100)
        4. Best posting time
        5. Hashtag suggestions
        6. Content improvements
        
        Return as JSON.
        """
        
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            
            ai_analysis = json.loads(response.choices[0].message.content)
            
            return {
                'clip_id': clip['id'],
                'predicted_views': ai_analysis.get('estimated_views', '10K-50K'),
                'engagement_rate': ai_analysis.get('engagement_rate', '3-5%'),
                'viral_potential': ai_analysis.get('viral_potential', clip['viral_score']),
                'predicted_score': ai_analysis.get('viral_potential', clip['viral_score']),
                'best_posting_time': ai_analysis.get('best_posting_time', '7-9 PM'),
                'hashtags': ai_analysis.get('hashtags', []),
                'improvements': ai_analysis.get('improvements', [])
            }
            
        except Exception as e:
            print(f"❌ Analytics generation failed: {e}")
            return {
                'clip_id': clip['id'],
                'predicted_score': clip['viral_score'],
                'viral_potential': clip['viral_score']
            }

    def create_fallback_segments(self, transcript: Dict) -> List[Dict]:
        """Create segments when AI analysis fails"""
        segments = []
        duration = transcript['duration']
        segment_length = 45  # 45-second segments
        
        for i in range(0, int(duration), segment_length):
            start = i
            end = min(i + segment_length, duration)
            
            segments.append({
                'start_time': start,
                'end_time': end,
                'duration': end - start,
                'title': f"Clip {len(segments) + 1}",
                'viral_score': 70,  # Default score
                'platform': 'instagram',
                'hook_strength': 7,
                'emotional_impact': 6,
                'information_value': 7
            })
            
            if len(segments) >= 8:  # Limit to 8 clips
                break
        
        return segments

    def generate_content_recommendations(self, clips: List[Dict], transcript: Dict) -> List[str]:
        """Generate content improvement recommendations"""
        return [
            "Add stronger hooks in the first 3 seconds",
            "Include more emotional storytelling elements",
            "Use specific numbers and statistics",
            "Add clear calls-to-action",
            "Create cliffhangers for engagement"
        ]

    def identify_trending_topics(self, transcript: Dict) -> List[str]:
        """Identify trending topics from content"""
        # Simple keyword extraction - can be enhanced with NLP
        text = transcript['full_text'].lower()
        trending_keywords = []
        
        # Common trending topics
        trend_words = ['ai', 'business', 'success', 'money', 'growth', 'tips', 'strategy']
        
        for word in trend_words:
            if word in text:
                trending_keywords.append(f"#{word}")
        
        return trending_keywords[:5]

    def suggest_posting_times(self, clips: List[Dict]) -> Dict:
        """Suggest optimal posting times by platform"""
        return {
            'instagram': '7-9 PM EST',
            'tiktok': '6-10 PM EST',
            'youtube_shorts': '2-4 PM EST',
            'twitter': '12-3 PM EST',
            'linkedin': '8-10 AM EST'
        }

def main():
    """Example usage of the AI automation system"""
    # Initialize the AI system
    ai_processor = ReelRemixAI()
    
    # Process a video
    video_path = "/path/to/your/video.mp4"
    output_dir = "/path/to/output/directory"
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Process the video
    results = ai_processor.process_video_complete(video_path, output_dir)
    
    # Print results
    print(f"✅ Processing complete!")
    print(f"📊 Generated {results['total_clips']} clips")
    print(f"⭐ Average viral score: {sum(clip['viral_score'] for clip in results['clips']) / len(results['clips']):.1f}")
    
    # Save results to JSON
    with open(os.path.join(output_dir, 'processing_results.json'), 'w') as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    main()
