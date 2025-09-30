import numpy as np
from typing import Dict, Any, List
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
import re

class SegmentationService:
    def __init__(self):
        # Load sentence transformer for semantic similarity
        self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
        
    async def generate_segments(self, transcript_result: Dict[str, Any], upload_id: str) -> List[Dict[str, Any]]:
        """
        Generate segment candidates from transcript using multiple strategies
        """
        segments = transcript_result.get('segments', [])
        words = transcript_result.get('wordsData', [])
        
        if not segments:
            raise Exception("No transcript segments found")
        
        # Strategy 1: Topic-based segmentation
        topic_segments = self._segment_by_topic(segments)
        
        # Strategy 2: Silence-based segmentation
        silence_segments = self._segment_by_silence(segments)
        
        # Strategy 3: Speaker change segmentation (if available)
        speaker_segments = self._segment_by_speaker_change(segments)
        
        # Strategy 4: Semantic boundary detection
        semantic_segments = self._segment_by_semantics(segments)
        
        # Combine and deduplicate segments
        all_segments = []
        all_segments.extend(topic_segments)
        all_segments.extend(silence_segments)
        all_segments.extend(speaker_segments)
        all_segments.extend(semantic_segments)
        
        # Filter and optimize segments
        filtered_segments = self._filter_segments(all_segments)
        
        # Add metadata and prepare for scoring
        final_segments = []
        for i, segment in enumerate(filtered_segments):
            final_segments.append({
                'id': f"segment_{upload_id}_{i}",
                'uploadId': upload_id,
                'startS': segment['start'],
                'endS': segment['end'],
                'text': segment['text'],
                'words': segment.get('words', []),
                'duration': segment['end'] - segment['start'],
                'strategy': segment.get('strategy', 'unknown'),
                'preliminary_score': segment.get('preliminary_score', 0.0)
            })
        
        return final_segments
    
    def _segment_by_topic(self, segments: List[Dict]) -> List[Dict]:
        """Segment by topic changes using sentence embeddings"""
        if len(segments) < 2:
            return []
        
        # Extract text from segments
        texts = [seg['text'] for seg in segments]
        
        # Generate embeddings
        embeddings = self.sentence_model.encode(texts)
        
        # Calculate similarity between consecutive segments
        topic_segments = []
        current_start = segments[0]['start']
        current_text = segments[0]['text']
        
        for i in range(1, len(segments)):
            similarity = cosine_similarity(
                embeddings[i-1].reshape(1, -1),
                embeddings[i].reshape(1, -1)
            )[0][0]
            
            # If similarity drops below threshold, create a segment
            if similarity < 0.7:  # Threshold for topic change
                topic_segments.append({
                    'start': current_start,
                    'end': segments[i-1]['end'],
                    'text': current_text,
                    'strategy': 'topic_change',
                    'preliminary_score': 0.6
                })
                current_start = segments[i]['start']
                current_text = segments[i]['text']
            else:
                current_text += " " + segments[i]['text']
        
        # Add final segment
        if current_start < segments[-1]['end']:
            topic_segments.append({
                'start': current_start,
                'end': segments[-1]['end'],
                'text': current_text,
                'strategy': 'topic_change',
                'preliminary_score': 0.6
            })
        
        return topic_segments
    
    def _segment_by_silence(self, segments: List[Dict]) -> List[Dict]:
        """Segment by silence gaps between segments"""
        silence_segments = []
        
        for i in range(len(segments) - 1):
            current_end = segments[i]['end']
            next_start = segments[i + 1]['start']
            
            # If there's a significant gap (silence), consider it a natural break
            if next_start - current_end > 2.0:  # 2 second silence threshold
                # Look for good segment boundaries around the silence
                segment_start = max(0, current_end - 30)  # 30 seconds before silence
                segment_end = min(segments[-1]['end'], next_start + 30)  # 30 seconds after silence
                
                # Collect text for this segment
                segment_text = ""
                for seg in segments:
                    if seg['start'] >= segment_start and seg['end'] <= segment_end:
                        segment_text += seg['text'] + " "
                
                if segment_text.strip():
                    silence_segments.append({
                        'start': segment_start,
                        'end': segment_end,
                        'text': segment_text.strip(),
                        'strategy': 'silence_boundary',
                        'preliminary_score': 0.5
                    })
        
        return silence_segments
    
    def _segment_by_speaker_change(self, segments: List[Dict]) -> List[Dict]:
        """Segment by speaker changes (if speaker info available)"""
        speaker_segments = []
        
        # Check if speaker information is available
        has_speaker_info = any('speaker' in seg for seg in segments)
        
        if not has_speaker_info:
            return speaker_segments
        
        current_speaker = None
        current_start = None
        current_text = ""
        
        for segment in segments:
            speaker = segment.get('speaker', 'unknown')
            
            if current_speaker is None:
                current_speaker = speaker
                current_start = segment['start']
                current_text = segment['text']
            elif speaker != current_speaker:
                # Speaker changed, create segment
                speaker_segments.append({
                    'start': current_start,
                    'end': segment['start'],
                    'text': current_text,
                    'strategy': 'speaker_change',
                    'preliminary_score': 0.7
                })
                current_speaker = speaker
                current_start = segment['start']
                current_text = segment['text']
            else:
                current_text += " " + segment['text']
        
        # Add final segment
        if current_start is not None:
            speaker_segments.append({
                'start': current_start,
                'end': segments[-1]['end'],
                'text': current_text,
                'strategy': 'speaker_change',
                'preliminary_score': 0.7
            })
        
        return speaker_segments
    
    def _segment_by_semantics(self, segments: List[Dict]) -> List[Dict]:
        """Segment by semantic boundaries using clustering"""
        if len(segments) < 5:
            return []
        
        # Extract text and create embeddings
        texts = [seg['text'] for seg in segments]
        embeddings = self.sentence_model.encode(texts)
        
        # Use clustering to find semantic groups
        n_clusters = min(10, len(segments) // 3)  # Reasonable number of clusters
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        cluster_labels = kmeans.fit_predict(embeddings)
        
        semantic_segments = []
        current_cluster = cluster_labels[0]
        current_start = segments[0]['start']
        current_text = segments[0]['text']
        
        for i in range(1, len(segments)):
            if cluster_labels[i] != current_cluster:
                # Cluster changed, create segment
                semantic_segments.append({
                    'start': current_start,
                    'end': segments[i-1]['end'],
                    'text': current_text,
                    'strategy': 'semantic_boundary',
                    'preliminary_score': 0.5
                })
                current_cluster = cluster_labels[i]
                current_start = segments[i]['start']
                current_text = segments[i]['text']
            else:
                current_text += " " + segments[i]['text']
        
        # Add final segment
        semantic_segments.append({
            'start': current_start,
            'end': segments[-1]['end'],
            'text': current_text,
            'strategy': 'semantic_boundary',
            'preliminary_score': 0.5
        })
        
        return semantic_segments
    
    def _filter_segments(self, segments: List[Dict]) -> List[Dict]:
        """Filter and optimize segments for quality"""
        filtered = []
        
        for segment in segments:
            duration = segment['end'] - segment['start']
            text = segment['text'].strip()
            
            # Filter criteria
            if (
                15 <= duration <= 90 and  # Duration between 15-90 seconds
                len(text) > 20 and  # Minimum text length
                len(text.split()) > 5  # Minimum word count
            ):
                # Add quality indicators
                segment['word_count'] = len(text.split())
                segment['char_count'] = len(text)
                segment['words_per_second'] = segment['word_count'] / duration
                
                # Boost score for optimal characteristics
                if 30 <= duration <= 60:  # Sweet spot for short-form content
                    segment['preliminary_score'] += 0.2
                
                if 2 <= segment['words_per_second'] <= 4:  # Good pacing
                    segment['preliminary_score'] += 0.1
                
                filtered.append(segment)
        
        # Remove overlapping segments (keep highest scoring)
        filtered = self._remove_overlaps(filtered)
        
        # Sort by preliminary score and return top candidates
        filtered.sort(key=lambda x: x['preliminary_score'], reverse=True)
        
        return filtered[:50]  # Return top 50 candidates for AI scoring
    
    def _remove_overlaps(self, segments: List[Dict]) -> List[Dict]:
        """Remove overlapping segments, keeping the highest scoring ones"""
        segments.sort(key=lambda x: x['start'])
        non_overlapping = []
        
        for segment in segments:
            overlaps = False
            for existing in non_overlapping:
                if (segment['start'] < existing['end'] and 
                    segment['end'] > existing['start']):
                    # There's an overlap
                    if segment['preliminary_score'] > existing['preliminary_score']:
                        # Replace existing with current segment
                        non_overlapping.remove(existing)
                        non_overlapping.append(segment)
                    overlaps = True
                    break
            
            if not overlaps:
                non_overlapping.append(segment)
        
        return non_overlapping
