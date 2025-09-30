#!/bin/bash

# ReelRemix AI Automation Setup Script
# This script installs all dependencies needed for automated video processing

echo "🚀 Setting up ReelRemix AI Automation System..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install system dependencies
echo "🔧 Installing system dependencies..."
sudo apt install -y \
    python3-pip \
    python3-venv \
    ffmpeg \
    libsm6 \
    libxext6 \
    libfontconfig1 \
    libxrender1 \
    libgl1-mesa-glx \
    libglib2.0-0

# Create Python virtual environment
echo "🐍 Creating Python virtual environment..."
python3 -m venv reelremix-ai-env
source reelremix-ai-env/bin/activate

# Install Python packages
echo "📚 Installing Python packages..."
pip install --upgrade pip

# Core AI and video processing packages
pip install \
    openai==1.3.0 \
    whisper-openai==20231117 \
    moviepy==1.0.3 \
    opencv-python==4.8.1.78 \
    numpy==1.24.3 \
    requests==2.31.0 \
    python-dotenv==1.0.0

# Additional packages for advanced features
pip install \
    torch==2.1.0 \
    torchvision==0.16.0 \
    torchaudio==2.1.0 \
    transformers==4.35.0 \
    pillow==10.0.1 \
    scipy==1.11.4

# Create environment file template
echo "📝 Creating environment configuration..."
cat > .env.ai << 'EOF'
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Video Processing Settings
MAX_VIDEO_DURATION=3600  # 1 hour max
MAX_CLIPS_PER_VIDEO=10
DEFAULT_CLIP_DURATION=45

# Output Quality Settings
VIDEO_QUALITY=high
AUDIO_BITRATE=128k
VIDEO_BITRATE=2000k

# Platform Settings
INSTAGRAM_WIDTH=1080
INSTAGRAM_HEIGHT=1920
TIKTOK_WIDTH=1080
TIKTOK_HEIGHT=1920
YOUTUBE_SHORTS_WIDTH=1080
YOUTUBE_SHORTS_HEIGHT=1920

# Processing Directories
INPUT_DIR=./input_videos
OUTPUT_DIR=./output_clips
TEMP_DIR=./temp_processing
EOF

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p input_videos
mkdir -p output_clips
mkdir -p temp_processing
mkdir -p logs

# Create test script
echo "🧪 Creating test script..."
cat > test_ai_system.py << 'EOF'
#!/usr/bin/env python3
"""
Test script for ReelRemix AI Automation System
"""

import os
import sys
from pathlib import Path

def test_dependencies():
    """Test if all required packages are installed"""
    print("🔍 Testing dependencies...")
    
    try:
        import openai
        print("✅ OpenAI package installed")
    except ImportError:
        print("❌ OpenAI package missing")
        return False
    
    try:
        import whisper
        print("✅ Whisper package installed")
    except ImportError:
        print("❌ Whisper package missing")
        return False
    
    try:
        from moviepy.editor import VideoFileClip
        print("✅ MoviePy package installed")
    except ImportError:
        print("❌ MoviePy package missing")
        return False
    
    try:
        import cv2
        print("✅ OpenCV package installed")
    except ImportError:
        print("❌ OpenCV package missing")
        return False
    
    return True

def test_ffmpeg():
    """Test if FFmpeg is available"""
    print("🎬 Testing FFmpeg...")
    
    try:
        import subprocess
        result = subprocess.run(['ffmpeg', '-version'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ FFmpeg is installed and working")
            return True
        else:
            print("❌ FFmpeg not working properly")
            return False
    except FileNotFoundError:
        print("❌ FFmpeg not found")
        return False

def test_openai_connection():
    """Test OpenAI API connection"""
    print("🤖 Testing OpenAI connection...")
    
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key or api_key == 'your_openai_api_key_here':
        print("⚠️  OpenAI API key not configured")
        print("   Please set OPENAI_API_KEY in .env.ai file")
        return False
    
    try:
        import openai
        client = openai.OpenAI(api_key=api_key)
        
        # Test with a simple request
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=5
        )
        print("✅ OpenAI API connection successful")
        return True
    except Exception as e:
        print(f"❌ OpenAI API connection failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 ReelRemix AI System Test Suite")
    print("=" * 50)
    
    tests_passed = 0
    total_tests = 3
    
    # Test dependencies
    if test_dependencies():
        tests_passed += 1
    
    # Test FFmpeg
    if test_ffmpeg():
        tests_passed += 1
    
    # Test OpenAI (optional)
    if test_openai_connection():
        tests_passed += 1
    else:
        print("ℹ️  OpenAI test skipped - configure API key to test")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tests_passed}/{total_tests} passed")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed! System is ready for use.")
        return True
    else:
        print("⚠️  Some tests failed. Please check the issues above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
EOF

# Create usage example
echo "📖 Creating usage example..."
cat > example_usage.py << 'EOF'
#!/usr/bin/env python3
"""
Example usage of ReelRemix AI Automation System
"""

import os
from ai_automation_system import ReelRemixAI

def process_sample_video():
    """Example of processing a video with the AI system"""
    
    # Initialize the AI processor
    print("🤖 Initializing ReelRemix AI...")
    ai_processor = ReelRemixAI()
    
    # Set up paths
    video_path = "input_videos/sample_video.mp4"
    output_dir = "output_clips"
    
    # Check if sample video exists
    if not os.path.exists(video_path):
        print(f"❌ Sample video not found at {video_path}")
        print("📁 Please place a video file at input_videos/sample_video.mp4")
        return
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"🎬 Processing video: {video_path}")
    
    try:
        # Process the video
        results = ai_processor.process_video_complete(video_path, output_dir)
        
        # Display results
        print("\n🎉 Processing Complete!")
        print(f"📊 Generated {results['total_clips']} clips")
        
        for i, clip in enumerate(results['clips'], 1):
            print(f"  Clip {i}: {clip['title']}")
            print(f"    Duration: {clip['duration']:.1f}s")
            print(f"    Viral Score: {clip['viral_score']}/100")
            print(f"    Platform: {clip['platform']}")
            print()
        
        # Show analytics
        analytics = results['analytics']
        print(f"⭐ Overall Score: {analytics['overall_score']:.1f}/100")
        
        if analytics['recommendations']:
            print("\n💡 Recommendations:")
            for rec in analytics['recommendations']:
                print(f"  • {rec}")
        
        print(f"\n📁 Clips saved to: {output_dir}")
        
    except Exception as e:
        print(f"❌ Processing failed: {e}")
        print("💡 Make sure you have:")
        print("  1. Set OPENAI_API_KEY in .env.ai")
        print("  2. Installed all dependencies")
        print("  3. Valid video file format")

if __name__ == "__main__":
    process_sample_video()
EOF

# Make scripts executable
chmod +x test_ai_system.py
chmod +x example_usage.py

# Create requirements.txt for easy installation
echo "📋 Creating requirements.txt..."
cat > requirements-ai.txt << 'EOF'
openai==1.3.0
whisper-openai==20231117
moviepy==1.0.3
opencv-python==4.8.1.78
numpy==1.24.3
requests==2.31.0
python-dotenv==1.0.0
torch==2.1.0
torchvision==0.16.0
torchaudio==2.1.0
transformers==4.35.0
pillow==10.0.1
scipy==1.11.4
EOF

echo "✅ Setup complete!"
echo ""
echo "🎯 Next Steps:"
echo "1. Activate the virtual environment:"
echo "   source reelremix-ai-env/bin/activate"
echo ""
echo "2. Configure your OpenAI API key in .env.ai:"
echo "   nano .env.ai"
echo ""
echo "3. Test the installation:"
echo "   python3 test_ai_system.py"
echo ""
echo "4. Place a test video in input_videos/ and run:"
echo "   python3 example_usage.py"
echo ""
echo "📚 Documentation:"
echo "   - AI system code: ai-automation-system.py"
echo "   - Configuration: .env.ai"
echo "   - Test suite: test_ai_system.py"
echo "   - Example usage: example_usage.py"
echo ""
echo "💰 Cost Estimates (with OpenAI API):"
echo "   - Transcription: ~$0.006 per minute of audio"
echo "   - AI Analysis: ~$0.03 per 1K tokens (~$0.50 per video)"
echo "   - Total per video: ~$1-3 depending on length"
echo ""
echo "🚀 Ready to automate your video processing!"
