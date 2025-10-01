// API service for ReelRemix frontend with AI processing
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://reelremix-new.onrender.com'
  : 'http://localhost:3000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async signup(userData) {
    const response = await this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data && response.data.token) {
      this.token = response.data.token;
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  }

  async signin(credentials) {
    const response = await this.request('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data && response.data.token) {
      this.token = response.data.token;
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  }

  async signout() {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  async getDashboardOverview() {
    return await this.request('/api/dashboard/overview');
  }

  // New AI processing endpoints
  async uploadVideo(fileName, fileSize) {
    return await this.request('/api/projects/upload', {
      method: 'POST',
      body: JSON.stringify({ fileName, fileSize }),
    });
  }

  async getProjects() {
    return await this.request('/api/projects');
  }

  async getProject(projectId) {
    return await this.request(`/api/projects/${projectId}`);
  }

  async getProjectClips(projectId) {
    return await this.request(`/api/projects/${projectId}/clips`);
  }

  async deleteProject(projectId) {
    return await this.request(`/api/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  async downloadClip(clipId) {
    const response = await fetch(`${this.baseURL}/api/clips/${clipId}/download`, {
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return response.blob();
  }

  async getClipThumbnail(clipId) {
    return `${this.baseURL}/api/clips/${clipId}/thumbnail`;
  }

  async healthCheck() {
    return await this.request('/health');
  }

  isAuthenticated() {
    return !!this.token;
  }

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}

export default new ApiService();
