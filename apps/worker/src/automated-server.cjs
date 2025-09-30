const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const axios = require('axios');

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002',
      'https://reelremix.vercel.app',
      'https://your-frontend-domain.vercel.app'
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create necessary directories
const uploadDir = path.join(__dirname, '../../../uploads');
const outputDir = path.join(__dirname, '../../../output');
const tempDir = path.join(__dirname, '../../../temp');

[uploadDir, outputDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `video-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|mov|avi|mkv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// In-memory storage for demo (replace with database in production)
const users = new Map();
const projects = new Map();
const processingJobs = new Map();

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9);
const generateToken = () => 'token_' + Math.random().toString(36).substr(2, 15);

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }
  
  // Find user by token (in production, verify JWT)
  let user = null;
  for (const [userId, userData] of users.entries()) {
    if (userData.token === token) {
      user = { id: userId, ...userData };
      break;
    }
  }
  
  if (!user) {
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
  
  req.user = user;
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ReelRemix Automated Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '2.0.0-automated'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ReelRemix Automated API Server',
    version: '2.0.0-automated',
    features: ['Automated AI Processing', 'Multi-platform Export', 'Real-time Status'],
    documentation: '/api/system/endpoints'
  });
});

// Authentication routes
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required'
    });
  }
  
  // Check if user exists
  for (const userData of users.values()) {
    if (userData.email === email) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }
  }
  
  const userId = generateId();
  const token = generateToken();
  
  const user = {
    id: userId,
    name,
    email,
    credits: 100, // Free credits for new users
    plan: 'starter',
    createdAt: new Date().toISOString(),
    token
  };
  
  users.set(userId, user);
  
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        credits: user.credits,
        plan: user.plan,
        createdAt: user.createdAt
      },
      token: user.token
    }
  });
});

app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  
  // Find user by email
  let user = null;
  for (const userData of users.values()) {
    if (userData.email === email) {
      user = userData;
      break;
    }
  }
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
  
  res.json({
    success: true,
    message: 'Signed in successfully',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        credits: user.credits,
        plan: user.plan,
        createdAt: user.createdAt
      },
      token: user.token
    }
  });
});

// Video processing routes
app.post('/api/videos/upload', authenticateToken, upload.single('video'), async (req, res) => {
  try {
    const { title, description, url } = req.body;
    const user = req.user;
    
    // Check credits
    if (user.credits < 10) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient credits. You need 10 credits to process a video.',
        creditsRequired: 10,
        creditsAvailable: user.credits
      });
    }
    
    let videoPath = null;
    let videoUrl = null;
    
    if (req.file) {
      // File upload
      videoPath = req.file.path;
      videoUrl = `/uploads/${req.file.filename}`;
    } else if (url) {
      // URL processing (YouTube, Vimeo, etc.)
      videoUrl = url;
      // In production, download the video from URL
      videoPath = await downloadVideoFromUrl(url);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either video file or URL is required'
      });
    }
    
    const projectId = generateId();
    const jobId = generateId();
    
    // Create project
    const project = {
      id: projectId,
      userId: user.id,
      title: title || 'Untitled Video',
      description: description || '',
      videoPath,
      videoUrl,
      status: 'QUEUED',
      progress: 0,
      createdAt: new Date().toISOString(),
      clips: [],
      analytics: {}
    };
    
    projects.set(projectId, project);
    
    // Deduct credits
    user.credits -= 10;
    users.set(user.id, user);
    
    // Start processing job
    const job = {
      id: jobId,
      projectId,
      userId: user.id,
      status: 'QUEUED',
      progress: 0,
      startedAt: new Date().toISOString(),
      logs: []
    };
    
    processingJobs.set(jobId, job);
    
    // Start async processing
    processVideoAsync(jobId, projectId, videoPath);
    
    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully and queued for processing',
      data: {
        projectId,
        jobId,
        status: 'QUEUED',
        creditsDeducted: 10,
        creditsRemaining: user.credits,
        estimatedProcessingTime: '5-10 minutes'
      }
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

// Get processing status
app.get('/api/videos/status/:jobId', authenticateToken, (req, res) => {
  const { jobId } = req.params;
  const job = processingJobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }
  
  if (job.userId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  const project = projects.get(job.projectId);
  
  res.json({
    success: true,
    data: {
      jobId: job.id,
      projectId: job.projectId,
      status: job.status,
      progress: job.progress,
      message: getStatusMessage(job.status, job.progress),
      clips: project ? project.clips : [],
      logs: job.logs,
      startedAt: job.startedAt,
      completedAt: job.completedAt
    }
  });
});

// Get project details
app.get('/api/projects/:projectId', authenticateToken, (req, res) => {
  const { projectId } = req.params;
  const project = projects.get(projectId);
  
  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }
  
  if (project.userId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  res.json({
    success: true,
    data: project
  });
});

// Dashboard overview
app.get('/api/dashboard/overview', authenticateToken, (req, res) => {
  const user = req.user;
  const userProjects = Array.from(projects.values()).filter(p => p.userId === user.id);
  
  const totalClips = userProjects.reduce((sum, project) => sum + project.clips.length, 0);
  const completedProjects = userProjects.filter(p => p.status === 'COMPLETED').length;
  
  res.json({
    success: true,
    data: {
      stats: {
        totalProjects: userProjects.length,
        completedProjects,
        totalClips,
        creditsRemaining: user.credits,
        plan: user.plan
      },
      recentProjects: userProjects
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(project => ({
          id: project.id,
          title: project.title,
          status: project.status,
          clipsGenerated: project.clips.length,
          createdAt: project.createdAt,
          progress: project.progress
        }))
    }
  });
});

// Billing plans
app.get('/api/billing/plans', (req, res) => {
  res.json({
    success: true,
    data: {
      plans: [
        {
          id: 'starter',
          name: 'Starter',
          price: 59,
          credits: 80,
          features: [
            '80 video processing credits',
            'Up to 400 minutes of source content',
            'All platform formats (Instagram, TikTok, YouTube)',
            'AI-powered clip selection',
            'Auto-generated captions',
            'Basic analytics'
          ],
          popular: false
        },
        {
          id: 'pro',
          name: 'Pro',
          price: 99,
          credits: 240,
          features: [
            '240 video processing credits',
            'Up to 1,200 minutes of source content',
            'All Starter features',
            'Advanced analytics and insights',
            'Custom branding options',
            'Priority processing',
            'API access'
          ],
          popular: true
        },
        {
          id: 'business',
          name: 'Business',
          price: 199,
          credits: 999999,
          features: [
            'Unlimited video processing',
            'Unlimited source content',
            'All Pro features',
            'White-label solution',
            'Custom AI model training',
            'Dedicated support',
            'Team collaboration tools'
          ],
          popular: false
        }
      ]
    }
  });
});

// System endpoints documentation
app.get('/api/system/endpoints', (req, res) => {
  res.json({
    success: true,
    data: {
      version: '2.0.0-automated',
      baseUrl: `${req.protocol}://${req.get('host')}`,
      features: [
        'Automated AI video processing',
        'Multi-platform clip export',
        'Real-time processing status',
        'Credit-based billing system',
        'User authentication and management'
      ],
      endpoints: {
        authentication: {
          base: '/api/auth',
          endpoints: [
            { method: 'POST', path: '/signup', description: 'Create new user account' },
            { method: 'POST', path: '/signin', description: 'Sign in user' }
          ]
        },
        videos: {
          base: '/api/videos',
          endpoints: [
            { method: 'POST', path: '/upload', description: 'Upload video for automated processing' },
            { method: 'GET', path: '/status/:jobId', description: 'Get real-time processing status' }
          ]
        },
        projects: {
          base: '/api/projects',
          endpoints: [
            { method: 'GET', path: '/:projectId', description: 'Get project details and clips' }
          ]
        },
        dashboard: {
          base: '/api/dashboard',
          endpoints: [
            { method: 'GET', path: '/overview', description: 'Get user dashboard overview' }
          ]
        },
        billing: {
          base: '/api/billing',
          endpoints: [
            { method: 'GET', path: '/plans', description: 'Get subscription plans' }
          ]
        }
      }
    }
  });
});

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));
app.use('/output', express.static(outputDir));

// Async video processing function
async function processVideoAsync(jobId, projectId, videoPath) {
  const job = processingJobs.get(jobId);
  const project = projects.get(projectId);
  
  if (!job || !project) return;
  
  try {
    // Update status to processing
    job.status = 'PROCESSING';
    job.progress = 10;
    job.logs.push({ timestamp: new Date().toISOString(), message: 'Starting AI analysis...' });
    project.status = 'PROCESSING';
    project.progress = 10;
    
    // Simulate AI processing steps
    await simulateProcessingStep(job, project, 20, 'Transcribing audio with AI...');
    await simulateProcessingStep(job, project, 40, 'Analyzing content for viral moments...');
    await simulateProcessingStep(job, project, 60, 'Identifying optimal clip segments...');
    await simulateProcessingStep(job, project, 80, 'Generating clips with captions...');
    await simulateProcessingStep(job, project, 90, 'Exporting multiple platform formats...');
    
    // Generate mock clips
    const clips = generateMockClips(project.title);
    project.clips = clips;
    
    // Complete processing
    job.status = 'COMPLETED';
    job.progress = 100;
    job.completedAt = new Date().toISOString();
    job.logs.push({ timestamp: new Date().toISOString(), message: `Processing completed! Generated ${clips.length} clips.` });
    
    project.status = 'COMPLETED';
    project.progress = 100;
    project.analytics = generateMockAnalytics(clips);
    
    console.log(`✅ Processing completed for project ${projectId}`);
    
  } catch (error) {
    console.error(`❌ Processing failed for project ${projectId}:`, error);
    
    job.status = 'FAILED';
    job.logs.push({ timestamp: new Date().toISOString(), message: `Processing failed: ${error.message}` });
    
    project.status = 'FAILED';
    
    // Refund credits on failure
    const user = users.get(project.userId);
    if (user) {
      user.credits += 10;
      users.set(user.id, user);
    }
  }
}

async function simulateProcessingStep(job, project, progress, message) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  job.progress = progress;
  job.logs.push({ timestamp: new Date().toISOString(), message });
  
  project.progress = progress;
  
  console.log(`📊 ${message} (${progress}%)`);
}

function generateMockClips(videoTitle) {
  const clipTitles = [
    'The Hook That Changes Everything',
    'Mind-Blowing Insight Revealed',
    'The Mistake Everyone Makes',
    'Secret Strategy Exposed',
    'Emotional Breakthrough Moment',
    'Game-Changing Tip',
    'Surprising Truth About Success',
    'The One Thing That Matters Most'
  ];
  
  const platforms = ['instagram', 'tiktok', 'youtube_shorts', 'twitter'];
  
  return clipTitles.slice(0, 6 + Math.floor(Math.random() * 3)).map((title, index) => ({
    id: `clip_${index + 1}`,
    title,
    duration: 30 + Math.floor(Math.random() * 45), // 30-75 seconds
    viralScore: 70 + Math.floor(Math.random() * 30), // 70-100 score
    platform: platforms[index % platforms.length],
    startTime: index * 60 + Math.floor(Math.random() * 30),
    endTime: (index + 1) * 60 + Math.floor(Math.random() * 30),
    status: 'READY',
    formats: platforms.reduce((acc, platform) => {
      acc[platform] = {
        url: `/output/clip_${index + 1}_${platform}.mp4`,
        width: platform.includes('shorts') || platform === 'instagram' || platform === 'tiktok' ? 1080 : 1280,
        height: platform.includes('shorts') || platform === 'instagram' || platform === 'tiktok' ? 1920 : 720,
        size: Math.floor(Math.random() * 50) + 10 // 10-60 MB
      };
      return acc;
    }, {}),
    captions: `Auto-generated captions for: ${title}`,
    thumbnail: `/output/clip_${index + 1}_thumbnail.jpg`,
    createdAt: new Date().toISOString()
  }));
}

function generateMockAnalytics(clips) {
  const totalScore = clips.reduce((sum, clip) => sum + clip.viralScore, 0);
  const avgScore = totalScore / clips.length;
  
  return {
    overallScore: Math.round(avgScore),
    predictedViews: `${Math.floor(avgScore * 1000)}-${Math.floor(avgScore * 2000)}`,
    bestClip: clips.reduce((best, clip) => clip.viralScore > best.viralScore ? clip : best, clips[0]),
    platformRecommendations: {
      instagram: clips.filter(c => c.platform === 'instagram').length,
      tiktok: clips.filter(c => c.platform === 'tiktok').length,
      youtube_shorts: clips.filter(c => c.platform === 'youtube_shorts').length,
      twitter: clips.filter(c => c.platform === 'twitter').length
    },
    insights: [
      'Strong emotional hooks detected in 80% of clips',
      'Optimal posting time: 7-9 PM EST',
      'Recommended hashtags: #viral #content #success',
      'Average engagement prediction: 4.2%'
    ]
  };
}

function getStatusMessage(status, progress) {
  switch (status) {
    case 'QUEUED':
      return 'Video queued for processing...';
    case 'PROCESSING':
      if (progress < 30) return 'AI is analyzing your video content...';
      if (progress < 60) return 'Identifying the most engaging moments...';
      if (progress < 90) return 'Creating clips with auto-generated captions...';
      return 'Finalizing clips and generating analytics...';
    case 'COMPLETED':
      return 'Processing completed successfully!';
    case 'FAILED':
      return 'Processing failed. Please try again.';
    default:
      return 'Unknown status';
  }
}

async function downloadVideoFromUrl(url) {
  // Mock implementation - in production, use youtube-dl or similar
  console.log(`📥 Downloading video from URL: ${url}`);
  return `/temp/downloaded_${Date.now()}.mp4`;
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 500MB.',
        code: 'FILE_TOO_LARGE'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// 404 handler
app.use('*', (req, res) => {
  if (req.originalUrl.startsWith('/api/')) {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found',
      code: 'NOT_FOUND'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ReelRemix Automated Server running on port ${PORT}`);
  console.log(`📚 API documentation: http://localhost:${PORT}/api/system/endpoints`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Features: Automated AI Processing, Multi-platform Export, Real-time Status`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
