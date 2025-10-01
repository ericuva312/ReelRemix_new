const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Simple in-memory storage
const users = new Map();
const projects = new Map();
const clips = new Map();
const processingQueue = [];
let isProcessing = false;

const generateId = () => Math.random().toString(36).substr(2, 9);
const generateToken = () => 'token_' + Math.random().toString(36).substr(2, 15);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, corsHeaders);
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message) {
  sendJSON(res, statusCode, { success: false, message });
}

function authenticateUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  for (const [userId, user] of users.entries()) {
    if (user.token === token) {
      return { ...user, id: userId };
    }
  }
  return null;
}

// AI Video Analysis Functions
function analyzeVideoContent(videoPath) {
  return new Promise((resolve) => {
    // Simulate AI analysis - in real implementation, this would use FFmpeg + AI models
    setTimeout(() => {
      const scenes = [
        {
          start: 0,
          end: 30,
          score: 0.95,
          highlights: ['speaker introduction', 'key point'],
          transcript: 'Welcome to today\'s presentation. I\'m excited to share some key insights...'
        },
        {
          start: 45,
          end: 75,
          score: 0.88,
          highlights: ['data visualization', 'important statistic'],
          transcript: 'The data shows a significant trend that we need to address...'
        },
        {
          start: 120,
          end: 150,
          score: 0.92,
          highlights: ['conclusion', 'call to action'],
          transcript: 'In conclusion, these findings suggest we should take immediate action...'
        },
        {
          start: 200,
          end: 230,
          score: 0.85,
          highlights: ['Q&A', 'audience interaction'],
          transcript: 'That\'s a great question. Let me explain the methodology behind...'
        },
        {
          start: 300,
          end: 330,
          score: 0.90,
          highlights: ['key takeaway', 'memorable quote'],
          transcript: 'Remember, success isn\'t just about the destination, it\'s about the journey...'
        }
      ];
      
      resolve(scenes);
    }, 3000); // Simulate 3 seconds of AI processing
  });
}

function generateClipFromScene(scene, projectId, videoPath) {
  return new Promise((resolve) => {
    // Simulate clip generation - in real implementation, this would use FFmpeg
    setTimeout(() => {
      const clipId = generateId();
      const clip = {
        id: clipId,
        projectId: projectId,
        title: `Clip ${scene.start}s-${scene.end}s`,
        description: scene.highlights.join(', '),
        duration: scene.end - scene.start,
        startTime: scene.start,
        endTime: scene.end,
        score: scene.score,
        transcript: scene.transcript,
        status: 'ready',
        downloadUrl: `/api/clips/${clipId}/download`,
        thumbnailUrl: `/api/clips/${clipId}/thumbnail`,
        createdAt: new Date().toISOString()
      };
      
      clips.set(clipId, clip);
      resolve(clip);
    }, 2000); // Simulate 2 seconds per clip generation
  });
}

async function processVideo(projectId) {
  const project = projects.get(projectId);
  if (!project) return;
  
  try {
    console.log(`Starting AI processing for project ${projectId}`);
    project.status = 'analyzing';
    project.progress = 10;
    
    // Step 1: Analyze video content with AI
    console.log('Analyzing video content...');
    const scenes = await analyzeVideoContent(project.videoPath);
    project.progress = 40;
    project.analysis = scenes;
    
    // Step 2: Generate clips from best scenes
    console.log('Generating clips...');
    project.status = 'generating_clips';
    const generatedClips = [];
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (scene.score > 0.8) { // Only generate clips for high-scoring scenes
        const clip = await generateClipFromScene(scene, projectId, project.videoPath);
        generatedClips.push(clip);
        project.progress = 40 + ((i + 1) / scenes.length) * 50;
      }
    }
    
    // Step 3: Finalize project
    project.status = 'completed';
    project.progress = 100;
    project.clips = generatedClips.map(c => c.id);
    project.completedAt = new Date().toISOString();
    
    console.log(`Project ${projectId} completed with ${generatedClips.length} clips generated`);
    
  } catch (error) {
    console.error(`Error processing project ${projectId}:`, error);
    project.status = 'failed';
    project.error = error.message;
  }
}

async function processQueue() {
  if (isProcessing || processingQueue.length === 0) return;
  
  isProcessing = true;
  const projectId = processingQueue.shift();
  
  await processVideo(projectId);
  
  isProcessing = false;
  
  // Process next item in queue
  if (processingQueue.length > 0) {
    setTimeout(processQueue, 1000);
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // Health check
  if (pathname === '/health') {
    sendJSON(res, 200, {
      success: true,
      message: 'AI Video Processing Server healthy',
      timestamp: new Date().toISOString(),
      port: process.env.PORT || 3000,
      processing: isProcessing,
      queueLength: processingQueue.length
    });
    return;
  }

  // Authentication endpoints (same as before)
  if (pathname === '/api/auth/signup' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { name, email, password } = JSON.parse(body);
        
        if (!name || !email || !password) {
          sendError(res, 400, 'Name, email, and password are required');
          return;
        }

        for (const user of users.values()) {
          if (user.email === email) {
            sendError(res, 400, 'User already exists');
            return;
          }
        }

        const userId = generateId();
        const token = generateToken();
        const user = {
          id: userId,
          name,
          email,
          password,
          token,
          credits: 100,
          plan: 'starter',
          createdAt: new Date().toISOString()
        };

        users.set(userId, user);

        sendJSON(res, 201, {
          success: true,
          message: 'User created successfully',
          data: {
            user: { id: userId, name, email, credits: user.credits, plan: user.plan },
            token
          }
        });
      } catch (error) {
        sendError(res, 400, 'Invalid JSON');
      }
    });
    return;
  }

  if (pathname === '/api/auth/signin' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body);
        
        let foundUser = null;
        let userId = null;
        
        for (const [id, user] of users.entries()) {
          if (user.email === email && user.password === password) {
            foundUser = user;
            userId = id;
            break;
          }
        }

        if (!foundUser) {
          sendError(res, 401, 'Invalid credentials');
          return;
        }

        sendJSON(res, 200, {
          success: true,
          message: 'Login successful',
          data: {
            user: { id: userId, name: foundUser.name, email: foundUser.email, credits: foundUser.credits, plan: foundUser.plan },
            token: foundUser.token
          }
        });
      } catch (error) {
        sendError(res, 400, 'Invalid JSON');
      }
    });
    return;
  }

  // Protected routes
  const user = authenticateUser(req);
  if (!user && !pathname.startsWith('/api/clips/')) {
    sendError(res, 401, 'Authentication required');
    return;
  }

  // Dashboard overview
  if (pathname === '/api/dashboard/overview' && method === 'GET') {
    const userProjects = Array.from(projects.values()).filter(p => p.userId === user.id);
    const userClips = Array.from(clips.values()).filter(c => {
      const project = projects.get(c.projectId);
      return project && project.userId === user.id;
    });

    sendJSON(res, 200, {
      success: true,
      data: {
        stats: {
          totalProjects: userProjects.length,
          completedProjects: userProjects.filter(p => p.status === 'completed').length,
          totalClips: userClips.length,
          creditsRemaining: user.credits,
          plan: user.plan
        },
        recentProjects: userProjects.slice(-3).map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          progress: p.progress || 0,
          clips: p.clips ? p.clips.length : 0,
          createdAt: p.createdAt
        }))
      }
    });
    return;
  }

  // Upload video and create project
  if (pathname === '/api/projects/upload' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { fileName, fileSize } = JSON.parse(body);
        
        if (user.credits < 10) {
          sendError(res, 400, 'Insufficient credits. Each video processing requires 10 credits.');
          return;
        }

        const projectId = generateId();
        const project = {
          id: projectId,
          userId: user.id,
          name: fileName.replace(/\.[^/.]+$/, ""), // Remove file extension
          fileName: fileName,
          fileSize: fileSize,
          status: 'uploaded',
          progress: 0,
          videoPath: `/uploads/${projectId}/${fileName}`,
          clips: [],
          createdAt: new Date().toISOString()
        };

        projects.set(projectId, project);
        
        // Deduct credits
        user.credits -= 10;
        users.set(user.id, user);
        
        // Add to processing queue
        processingQueue.push(projectId);
        processQueue(); // Start processing if not already running

        sendJSON(res, 201, {
          success: true,
          message: 'Video uploaded successfully. AI processing started.',
          data: {
            project: {
              id: projectId,
              name: project.name,
              status: project.status,
              progress: project.progress,
              createdAt: project.createdAt
            },
            creditsRemaining: user.credits
          }
        });
      } catch (error) {
        sendError(res, 400, 'Invalid JSON');
      }
    });
    return;
  }

  // Get all projects
  if (pathname === '/api/projects' && method === 'GET') {
    const userProjects = Array.from(projects.values())
      .filter(p => p.userId === user.id)
      .map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        progress: p.progress || 0,
        clips: p.clips ? p.clips.length : 0,
        createdAt: p.createdAt,
        completedAt: p.completedAt,
        error: p.error
      }));

    sendJSON(res, 200, {
      success: true,
      data: userProjects
    });
    return;
  }

  // Get project details
  if (pathname.startsWith('/api/projects/') && method === 'GET') {
    const projectId = pathname.split('/')[3];
    const project = projects.get(projectId);

    if (!project || project.userId !== user.id) {
      sendError(res, 404, 'Project not found');
      return;
    }

    const projectClips = project.clips ? project.clips.map(clipId => clips.get(clipId)).filter(Boolean) : [];

    sendJSON(res, 200, {
      success: true,
      data: {
        ...project,
        clips: projectClips
      }
    });
    return;
  }

  // Get clips for a project
  if (pathname.startsWith('/api/projects/') && pathname.endsWith('/clips') && method === 'GET') {
    const projectId = pathname.split('/')[3];
    const project = projects.get(projectId);

    if (!project || project.userId !== user.id) {
      sendError(res, 404, 'Project not found');
      return;
    }

    const projectClips = project.clips ? project.clips.map(clipId => clips.get(clipId)).filter(Boolean) : [];

    sendJSON(res, 200, {
      success: true,
      data: projectClips
    });
    return;
  }

  // Delete project
  if (pathname.startsWith('/api/projects/') && method === 'DELETE') {
    const projectId = pathname.split('/')[3];
    const project = projects.get(projectId);

    if (!project || project.userId !== user.id) {
      sendError(res, 404, 'Project not found');
      return;
    }

    // Delete associated clips
    if (project.clips) {
      project.clips.forEach(clipId => clips.delete(clipId));
    }

    projects.delete(projectId);

    sendJSON(res, 200, {
      success: true,
      message: 'Project deleted successfully'
    });
    return;
  }

  // Get clip download (simulate)
  if (pathname.startsWith('/api/clips/') && pathname.endsWith('/download') && method === 'GET') {
    const clipId = pathname.split('/')[3];
    const clip = clips.get(clipId);

    if (!clip) {
      sendError(res, 404, 'Clip not found');
      return;
    }

    // In real implementation, this would serve the actual video file
    res.writeHead(200, {
      ...corsHeaders,
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="clip_${clipId}.mp4"`
    });
    res.end(`Simulated video clip data for ${clip.title}`);
    return;
  }

  // Get clip thumbnail (simulate)
  if (pathname.startsWith('/api/clips/') && pathname.endsWith('/thumbnail') && method === 'GET') {
    const clipId = pathname.split('/')[3];
    const clip = clips.get(clipId);

    if (!clip) {
      sendError(res, 404, 'Clip not found');
      return;
    }

    // Return a simple SVG thumbnail
    const svg = `<svg width="320" height="180" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="180" fill="#7c3aed"/>
      <text x="160" y="90" text-anchor="middle" fill="white" font-family="Arial" font-size="14">${clip.title}</text>
      <text x="160" y="110" text-anchor="middle" fill="white" font-family="Arial" font-size="12">${clip.duration}s</text>
    </svg>`;

    res.writeHead(200, {
      ...corsHeaders,
      'Content-Type': 'image/svg+xml'
    });
    res.end(svg);
    return;
  }

  // 404
  sendError(res, 404, 'Not found');
});

// Use Railway's provided port or fallback to 3000
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🤖 AI Video Processing Server running on ${HOST}:${PORT}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎬 AI Processing: Ready`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
