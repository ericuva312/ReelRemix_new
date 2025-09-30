// ReelRemix Automated API Service
// Connects to the fully automated backend for 100% hands-off processing

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  auth = {
    signup: async (userData) => {
      const response = await this.request('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      if (response.success && response.data.token) {
        this.setToken(response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response;
    },

    signin: async (credentials) => {
      const response = await this.request('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      if (response.success && response.data.token) {
        this.setToken(response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response;
    },

    signout: () => {
      this.setToken(null);
      localStorage.removeItem('user');
    },

    getCurrentUser: () => {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
  };

  // Video processing methods
  videos = {
    // Upload video file for automated processing
    uploadFile: async (file, metadata = {}) => {
      const formData = new FormData();
      formData.append('video', file);
      
      if (metadata.title) formData.append('title', metadata.title);
      if (metadata.description) formData.append('description', metadata.description);

      const response = await fetch(`${this.baseURL}/api/videos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      return data;
    },

    // Upload video from URL for automated processing
    uploadUrl: async (url, metadata = {}) => {
      return await this.request('/api/videos/upload', {
        method: 'POST',
        body: JSON.stringify({
          url,
          title: metadata.title,
          description: metadata.description,
        }),
      });
    },

    // Get real-time processing status
    getStatus: async (jobId) => {
      return await this.request(`/api/videos/status/${jobId}`);
    },

    // Poll processing status with automatic updates
    pollStatus: (jobId, onUpdate, onComplete, onError) => {
      const poll = async () => {
        try {
          const response = await this.videos.getStatus(jobId);
          
          if (response.success) {
            onUpdate(response.data);
            
            if (response.data.status === 'COMPLETED') {
              onComplete(response.data);
            } else if (response.data.status === 'FAILED') {
              onError(new Error('Processing failed'));
            } else {
              // Continue polling
              setTimeout(poll, 2000);
            }
          } else {
            onError(new Error(response.message));
          }
        } catch (error) {
          onError(error);
        }
      };

      poll();
    }
  };

  // Project management methods
  projects = {
    // Get project details with all clips
    get: async (projectId) => {
      return await this.request(`/api/projects/${projectId}`);
    },

    // Get all user projects
    list: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/api/projects${queryString ? `?${queryString}` : ''}`;
      return await this.request(endpoint);
    }
  };

  // Dashboard methods
  dashboard = {
    // Get dashboard overview with stats and recent projects
    getOverview: async () => {
      return await this.request('/api/dashboard/overview');
    }
  };

  // Billing methods
  billing = {
    // Get available subscription plans
    getPlans: async () => {
      return await this.request('/api/billing/plans');
    },

    // Create Stripe checkout session
    createCheckoutSession: async (planId) => {
      return await this.request('/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId }),
      });
    },

    // Get billing history
    getHistory: async () => {
      return await this.request('/api/billing/history');
    }
  };

  // System methods
  system = {
    // Get API health status
    getHealth: async () => {
      return await this.request('/health');
    },

    // Get API documentation
    getEndpoints: async () => {
      return await this.request('/api/system/endpoints');
    }
  };

  // Utility methods
  utils = {
    // Format file size
    formatFileSize: (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Format duration
    formatDuration: (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    // Validate video file
    validateVideoFile: (file) => {
      const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm'];
      const maxSize = 500 * 1024 * 1024; // 500MB

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload MP4, MOV, AVI, MKV, or WebM files.');
      }

      if (file.size > maxSize) {
        throw new Error('File too large. Maximum size is 500MB.');
      }

      return true;
    },

    // Validate YouTube/Vimeo URL
    validateVideoUrl: (url) => {
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
      const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+/;
      
      return youtubeRegex.test(url) || vimeoRegex.test(url);
    },

    // Get platform specifications
    getPlatformSpecs: () => {
      return {
        instagram: {
          name: 'Instagram Reels',
          aspectRatio: '9:16',
          maxDuration: 60,
          resolution: '1080x1920'
        },
        tiktok: {
          name: 'TikTok',
          aspectRatio: '9:16',
          maxDuration: 60,
          resolution: '1080x1920'
        },
        youtube_shorts: {
          name: 'YouTube Shorts',
          aspectRatio: '9:16',
          maxDuration: 60,
          resolution: '1080x1920'
        },
        twitter: {
          name: 'Twitter',
          aspectRatio: '16:9',
          maxDuration: 140,
          resolution: '1280x720'
        }
      };
    }
  };
}

// Create and export singleton instance
const api = new ApiService();

export default api;

// Named exports for convenience
export const {
  auth,
  videos,
  projects,
  dashboard,
  billing,
  system,
  utils
} = api;
