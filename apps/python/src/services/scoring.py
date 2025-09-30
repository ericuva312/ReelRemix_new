import openai
import json
import re
from typing import Dict, Any, List
import asyncio
import os
from datetime import datetime

class ScoringService:
    def __init__(self):
        openai.api_key = os.getenv('OPENAI_API_KEY')
        self.client = openai.OpenAI()
        
    async def score_segments(self, segments: List[Dict[str, Any]], transcript_result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Score segments for viral potential using AI and heuristics
        """
        if not segments:
            return []
        
        # Get context about the video
        video_context = self._extract_video_context(transcript_result)
        
        # Score segments in batches to avoid rate limits
        batch_size = 5
        scored_segments = []
        
        for i in range(0, len(segments), batch_size):
            batch = segments[i:i + batch_size]
            batch_scores = await self._score_batch(batch, video_context)
            scored_segments.extend(batch_scores)
            
            # Small delay to respect rate limits
            await asyncio.sleep(0.5)
        
        # Apply heuristic scoring
        for segment in scored_segments:
            heuristic_score = self._calculate_heuristic_score(segment)
            
            # Combine AI score with heuristic score
            ai_score = segment.get('ai_score', 0.5)
            final_score = (ai_score * 0.7) + (heuristic_score * 0.3)
            
            segment['score'] = min(1.0, max(0.0, final_score))
            segment['heuristic_score'] = heuristic_score
            segment['final_score'] = final_score
        
        # Sort by final score and return
        scored_segments.sort(key=lambda x: x['score'], reverse=True)
        
        return scored_segments
    
    def _extract_video_context(self, transcript_result: Dict[str, Any]) -> Dict[str, Any]:
        """Extract context about the video for better scoring"""
        segments = transcript_result.get('segments', [])
        full_text = ' '.join([seg['text'] for seg in segments])
        
        # Detect content type
        content_type = self._detect_content_type(full_text)
        
        # Extract key themes
        themes = self._extract_themes(full_text)
        
        return {
            'content_type': content_type,
            'themes': themes,
            'total_duration': transcript_result.get('duration', 0),
            'language': transcript_result.get('language', 'en')
        }
    
    def _detect_content_type(self, text: str) -> str:
        """Detect the type of content (podcast, interview, tutorial, etc.)"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['interview', 'conversation', 'chat', 'talk']):
            return 'interview'
        elif any(word in text_lower for word in ['tutorial', 'how to', 'learn', 'teach']):
            return 'tutorial'
        elif any(word in text_lower for word in ['podcast', 'episode', 'show']):
            return 'podcast'
        elif any(word in text_lower for word in ['story', 'experience', 'happened']):
            return 'story'
        else:
            return 'general'
    
    def _extract_themes(self, text: str) -> List[str]:
        """Extract key themes from the text"""
        # Simple keyword-based theme extraction
        themes = []
        
        theme_keywords = {
            'business': ['business', 'startup', 'entrepreneur', 'company', 'revenue', 'profit'],
            'technology': ['technology', 'ai', 'software', 'app', 'digital', 'tech'],
            'personal_development': ['growth', 'mindset', 'success', 'motivation', 'goals'],
            'health': ['health', 'fitness', 'wellness', 'exercise', 'nutrition'],
            'finance': ['money', 'investment', 'financial', 'wealth', 'income'],
            'relationships': ['relationship', 'love', 'family', 'friends', 'dating'],
            'education': ['education', 'learning', 'school', 'university', 'knowledge']
        }
        
        text_lower = text.lower()
        for theme, keywords in theme_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                themes.append(theme)
        
        return themes[:3]  # Return top 3 themes
    
    async def _score_batch(self, segments: List[Dict[str, Any]], context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Score a batch of segments using OpenAI"""
        try:
            # Prepare segments for AI analysis
            segments_for_ai = []
            for i, segment in enumerate(segments):
                segments_for_ai.append({
                    'id': i,
                    'text': segment['text'][:500],  # Limit text length
                    'duration': segment['endS'] - segment['startS']
                })
            
            # Create prompt for AI scoring
            prompt = self._create_scoring_prompt(segments_for_ai, context)
            
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert at identifying viral-worthy moments in video content for social media platforms like TikTok, Instagram Reels, and YouTube Shorts."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            # Parse AI response
            ai_scores = self._parse_ai_response(response.choices[0].message.content)
            
            # Apply AI scores to segments
            for i, segment in enumerate(segments):
                if i < len(ai_scores):
                    segment.update(ai_scores[i])
                else:
                    segment['ai_score'] = 0.5
                    segment['ai_rationale'] = "No AI analysis available"
            
            return segments
            
        except Exception as e:
            print(f"AI scoring failed: {e}")
            # Fallback to heuristic scoring only
            for segment in segments:
                segment['ai_score'] = 0.5
                segment['ai_rationale'] = f"AI scoring failed: {str(e)}"
            
            return segments
    
    def _create_scoring_prompt(self, segments: List[Dict], context: Dict[str, Any]) -> str:
        """Create prompt for AI scoring"""
        prompt = f"""
Analyze these video segments for viral potential on short-form platforms (TikTok, Instagram Reels, YouTube Shorts).

Context:
- Content Type: {context['content_type']}
- Themes: {', '.join(context['themes'])}
- Language: {context['language']}

For each segment, provide:
1. Score (0.0-1.0) for viral potential
2. Brief rationale (max 50 words)
3. Suggested hook/title (max 10 words)

Scoring criteria:
- Strong opening (question, claim, controversy)
- Emotional impact (surprise, humor, inspiration)
- Clear payoff within 30-60 seconds
- Minimal context required
- Relatable/shareable content

Segments to analyze:
"""
        
        for segment in segments:
            prompt += f"\nSegment {segment['id']} ({segment['duration']:.1f}s):\n{segment['text']}\n"
        
        prompt += "\nRespond in JSON format: [{\"id\": 0, \"score\": 0.8, \"rationale\": \"...\", \"suggested_title\": \"...\"}]"
        
        return prompt
    
    def _parse_ai_response(self, response_text: str) -> List[Dict[str, Any]]:
        """Parse AI response into structured data"""
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                scores = json.loads(json_str)
                
                # Validate and clean scores
                cleaned_scores = []
                for score in scores:
                    cleaned_scores.append({
                        'ai_score': max(0.0, min(1.0, float(score.get('score', 0.5)))),
                        'ai_rationale': score.get('rationale', '')[:200],  # Limit length
                        'suggested_title': score.get('suggested_title', '')[:50]
                    })
                
                return cleaned_scores
            
        except Exception as e:
            print(f"Failed to parse AI response: {e}")
        
        # Fallback
        return []
    
    def _calculate_heuristic_score(self, segment: Dict[str, Any]) -> float:
        """Calculate heuristic score based on content analysis"""
        text = segment['text'].lower()
        duration = segment['endS'] - segment['startS']
        
        score = 0.5  # Base score
        
        # Duration scoring (sweet spot: 30-60 seconds)
        if 30 <= duration <= 60:
            score += 0.15
        elif 15 <= duration <= 30 or 60 <= duration <= 90:
            score += 0.05
        else:
            score -= 0.1
        
        # Opening strength
        opening_indicators = [
            'what if', 'imagine', 'did you know', 'here\'s why', 'the truth is',
            'nobody talks about', 'secret', 'shocking', 'unbelievable',
            'you won\'t believe', 'this is crazy', 'wait until you hear'
        ]
        
        if any(indicator in text for indicator in opening_indicators):
            score += 0.15
        
        # Question detection
        if '?' in segment['text']:
            score += 0.1
        
        # Emotional words
        emotional_words = [
            'amazing', 'incredible', 'shocking', 'unbelievable', 'crazy',
            'insane', 'mind-blowing', 'game-changer', 'life-changing',
            'hilarious', 'terrifying', 'heartbreaking', 'inspiring'
        ]
        
        emotional_count = sum(1 for word in emotional_words if word in text)
        score += min(0.1, emotional_count * 0.02)
        
        # Numbers and statistics
        if re.search(r'\d+%|\$\d+|\d+x|#\d+', segment['text']):
            score += 0.05
        
        # Controversy/debate indicators
        controversy_words = [
            'controversial', 'debate', 'argue', 'disagree', 'wrong',
            'myth', 'lie', 'truth', 'exposed', 'revealed'
        ]
        
        if any(word in text for word in controversy_words):
            score += 0.1
        
        # Actionable content
        action_words = [
            'how to', 'steps', 'method', 'technique', 'strategy',
            'tip', 'trick', 'hack', 'secret', 'formula'
        ]
        
        if any(word in text for word in action_words):
            score += 0.08
        
        # Personal story indicators
        personal_indicators = [
            'i was', 'my experience', 'happened to me', 'i learned',
            'i discovered', 'i realized', 'my story', 'when i'
        ]
        
        if any(indicator in text for indicator in personal_indicators):
            score += 0.05
        
        # Ensure score is within bounds
        return max(0.0, min(1.0, score))
