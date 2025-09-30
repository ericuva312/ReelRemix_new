#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'apps/web/dist')));

// Mock user data
let users = [];
let projects = [];
let clips = [];
let currentUserId = null;

// Helper functions
const generateId = () => Math.random().toString(36).substr(2, 9);
const findUser = (email) => users.find(u => u.email === email);

// Auth endpoints
app.post('/api/auth/signup', (req, res) => {
  const { email, password, name } = req.body;
  
  if (findUser(email)) {
    return res.status(400).json({ success: false, error: 'User already exists' });
  }
  
  const user = {
    id: generateId(),
    email,
    name,
    password, // In real app, this would be hashed
    credits: 100,
    createdAt: new Date().toISOString()
  };
  
  users.push(user);
  currentUserId = user.id;
  
  res.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, credits: user.credits },
    token: 'mock-jwt-token'
  });
});

app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body;
  const user = findUser(email);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
  
  currentUserId = user.id;
  
  res.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, credits: user.credits },
    token: 'mock-jwt-token'
  });
});

app.get('/api/auth/profile', (req, res) => {
  if (!currentUserId) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  
  const user = users.find(u => u.id === currentUserId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  res.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, credits: user.credits }
  });
});

// Project endpoints
app.post('/api/projects', (req, res) => {
  if (!currentUserId) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  
  const { title, description } = req.body;
  const project = {
    id: generateId(),
    userId: currentUserId,
    title,
    description,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  projects.push(project);
  
  res.json({ success: true, project });
});

app.get('/api/projects', (req, res) => {
  if (!currentUserId) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  
  const userProjects = projects.filter(p => p.userId === currentUserId);
  
  res.json({
    success: true,
    projects: userProjects,
    pagination: {
      page: 1,
      limit: 20,
      total: userProjects.length,
      totalPages: 1
    }
  });
});

// Video processing endpoints
app.post('/api/processing/start', (req, res) => {
  if (!currentUserId) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  
  const { projectId, videoUrl, title } = req.body;
  const user = users.find(u => u.id === currentUserId);
  
  if (!user || user.credits < 10) {
    return res.status(402).json({ success: false, error: 'Insufficient credits' });
  }
  
  // Deduct credits
  user.credits -= 10;
  
  // Update project status
  const project = projects.find(p => p.id === projectId && p.userId === currentUserId);
  if (project) {
    project.status = 'PROCESSING';
    project.updatedAt = new Date().toISOString();
  }
  
  const uploadId = generateId();
  
  // Simulate processing completion after 10 seconds
  setTimeout(() => {
    if (project) {
      project.status = 'COMPLETED';
      project.updatedAt = new Date().toISOString();
      
      // Generate mock clips
      const clipTitles = [
        'The Secret to Viral Content',
        'Mind-Blowing Business Statistics',
        'Common Mistake Everyone Makes',
        'This Changed Everything',
        'What Nobody Tells You'
      ];
      
      clipTitles.forEach((clipTitle, index) => {
        clips.push({
          id: generateId(),
          projectId,
          title: clipTitle,
          description: `High-scoring viral moment from your video`,
          duration: Math.floor(Math.random() * 60) + 15, // 15-75 seconds
          viralScore: Math.floor(Math.random() * 40) + 60, // 60-100
          status: 'COMPLETED',
          startTime: index * 30,
          endTime: (index * 30) + Math.floor(Math.random() * 60) + 15,
          createdAt: new Date().toISOString()
        });
      });
    }
  }, 10000);
  
  res.json({
    success: true,
    message: 'Video processing started successfully',
    uploadId,
    jobId: generateId(),
    estimatedTime: '5-10 minutes'
  });
});

app.get('/api/processing/status/:uploadId', (req, res) => {
  if (!currentUserId) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  
  // Mock processing status
  const upload = {
    id: req.params.uploadId,
    status: 'PROCESSING',
    sourceType: 'YOUTUBE',
    storageKey: 'mock-video-url',
    durationS: 1800,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const jobStatus = {
    id: generateId(),
    state: 'active',
    progress: Math.floor(Math.random() * 100),
    processedOn: Date.now(),
    finishedOn: null,
    failedReason: null
  };
  
  res.json({
    success: true,
    upload,
    project: { title: 'Test Project', userId: currentUserId },
    transcripts: [],
    segments: [],
    jobStatus
  });
});

// Dashboard endpoints
app.get('/api/dashboard/overview', (req, res) => {
  if (!currentUserId) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  
  const userProjects = projects.filter(p => p.userId === currentUserId);
  const userClips = clips.filter(c => {
    const project = projects.find(p => p.id === c.projectId);
    return project && project.userId === currentUserId;
  });
  
  res.json({
    success: true,
    overview: {
      totalProjects: userProjects.length,
      totalClips: userClips.length,
      totalViews: Math.floor(Math.random() * 100000) + 10000,
      totalEngagement: Math.floor(Math.random() * 10000) + 1000,
      recentProjects: userProjects.slice(-5),
      topClips: userClips.sort((a, b) => b.viralScore - a.viralScore).slice(0, 5)
    }
  });
});

app.get('/api/dashboard/analytics', (req, res) => {
  if (!currentUserId) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  
  // Generate mock analytics data
  const viewsData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    views: Math.floor(Math.random() * 1000) + 100
  }));
  
  const engagementData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    likes: Math.floor(Math.random() * 100) + 10,
    shares: Math.floor(Math.random() * 50) + 5,
    comments: Math.floor(Math.random() * 30) + 2
  }));
  
  res.json({
    success: true,
    analytics: {
      viewsOverTime: viewsData,
      engagementOverTime: engagementData,
      topPerformingClips: clips.slice(0, 10),
      platformBreakdown: [
        { platform: 'TikTok', percentage: 45 },
        { platform: 'Instagram', percentage: 30 },
        { platform: 'YouTube', percentage: 25 }
      ]
    }
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'apps/web/dist/index.html'));
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ReelRemix Test Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`🔐 Auth: http://localhost:${PORT}/auth`);
  console.log(`💰 Pricing: http://localhost:${PORT}/pricing`);
  console.log(`📞 Contact: http://localhost:${PORT}/contact`);
  console.log(`ℹ️  About: http://localhost:${PORT}/about`);
});

module.exports = app;
