const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://5173-iedsff6vz1kwgknifs3h5-fb50248a.manusvm.computer'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'ReelRemix API'
  });
});

// Auth endpoints
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('Signup attempt:', { name, email });
    
    // Simulate user creation
    const user = {
      id: Date.now(),
      name,
      email,
      planType: 'starter',
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Account created successfully!',
      user,
      token: 'demo-jwt-token'
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating account' 
    });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Signin attempt:', { email });
    
    // Simulate user authentication
    const user = {
      id: 12345,
      name: 'Eric Chen',
      email,
      planType: 'pro',
      createdAt: '2024-01-01T00:00:00.000Z'
    };
    
    res.json({
      success: true,
      message: 'Welcome back!',
      user,
      token: 'demo-jwt-token'
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error signing in' 
    });
  }
});

// Video upload endpoint
app.post('/api/videos/upload', async (req, res) => {
  try {
    const { url, title } = req.body;
    console.log('Video upload:', { url, title });
    
    // Simulate video processing
    const project = {
      id: Date.now(),
      title: title || 'Untitled Project',
      sourceUrl: url,
      status: 'processing',
      progress: 0,
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Video upload started',
      project
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading video' 
    });
  }
});

// Project endpoints
app.get('/api/projects', (req, res) => {
  const mockProjects = [
    {
      id: 1,
      title: 'How I Built a $1M Business',
      sourceUrl: 'https://youtube.com/watch?v=demo1',
      status: 'completed',
      progress: 100,
      clipsGenerated: 12,
      totalViews: 245000,
      engagement: 8.5,
      createdAt: '2024-12-01T10:00:00.000Z'
    },
    {
      id: 2,
      title: 'Marketing Secrets Revealed',
      sourceUrl: 'https://youtube.com/watch?v=demo2',
      status: 'processing',
      progress: 65,
      clipsGenerated: 0,
      totalViews: 0,
      engagement: 0,
      createdAt: '2024-12-02T14:30:00.000Z'
    }
  ];
  
  res.json({
    success: true,
    projects: mockProjects
  });
});

app.get('/api/projects/:id', (req, res) => {
  const projectId = parseInt(req.params.id);
  
  const mockProject = {
    id: projectId,
    title: 'How I Built a $1M Business',
    sourceUrl: 'https://youtube.com/watch?v=demo1',
    status: 'completed',
    progress: 100,
    clipsGenerated: 12,
    totalViews: 245000,
    engagement: 8.5,
    createdAt: '2024-12-01T10:00:00.000Z',
    clips: [
      {
        id: 1,
        title: 'The Secret to Viral Content',
        duration: 45,
        score: 95,
        views: 125000,
        likes: 8500,
        shares: 1200,
        platform: 'TikTok',
        thumbnail: '/demo/clip1.jpg'
      },
      {
        id: 2,
        title: 'Why Most Businesses Fail',
        duration: 38,
        score: 88,
        views: 89000,
        likes: 6200,
        shares: 890,
        platform: 'Instagram',
        thumbnail: '/demo/clip2.jpg'
      }
    ]
  };
  
  res.json({
    success: true,
    project: mockProject
  });
});

// Analytics endpoints
app.get('/api/analytics/dashboard', (req, res) => {
  const mockAnalytics = {
    totalVideos: 47,
    totalClips: 234,
    totalViews: 1250000,
    avgEngagement: 7.8,
    recentActivity: [
      { type: 'clip_generated', title: 'New clip from "Business Tips"', time: '2 hours ago' },
      { type: 'video_uploaded', title: 'Uploaded "Marketing Secrets"', time: '5 hours ago' },
      { type: 'milestone', title: 'Reached 1M total views!', time: '1 day ago' }
    ]
  };
  
  res.json({
    success: true,
    analytics: mockAnalytics
  });
});

// Billing endpoints
app.get('/api/billing/subscription', (req, res) => {
  const mockSubscription = {
    planType: 'pro',
    status: 'active',
    currentPeriodEnd: '2025-01-30T00:00:00.000Z',
    usage: {
      renders: 45,
      minutes: 320,
      storage: 2.1
    },
    limits: {
      renders: 240,
      minutes: 1200,
      storage: 50
    }
  };
  
  res.json({
    success: true,
    subscription: mockSubscription
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint not found' 
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ReelRemix API Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 CORS enabled for frontend connections`);
});
