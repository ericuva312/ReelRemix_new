// API service for ReelRemix frontend
const API_BASE_URL = 'http://localhost:3001';

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

  // Authentication
  async signup(userData) {
    const response = await this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.token) {
      this.token = response.token;
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  async signin(credentials) {
    const response = await this.request('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.token) {
      this.token = response.token;
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  async signout() {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // Video Upload
  async uploadVideo(videoData) {
    return await this.request('/api/videos/upload', {
      method: 'POST',
      body: JSON.stringify(videoData),
    });
  }

  // Dashboard
  async getDashboardOverview() {
    return await this.request('/api/dashboard/overview');
  }

  async getDashboardAnalytics(period = '30d') {
    return await this.request(`/api/dashboard/analytics?period=${period}`);
  }

  async getDashboardActivity(limit = 20) {
    return await this.request(`/api/dashboard/activity?limit=${limit}`);
  }

  async getDashboardUsage() {
    return await this.request('/api/dashboard/usage');
  }

  // Projects
  async getProjects(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/api/projects${query ? '?' + query : ''}`);
  }

  async getProject(id) {
    return await this.request(`/api/projects/${id}`);
  }

  async createProject(projectData) {
    return await this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async updateProject(id, projectData) {
    return await this.request(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(id) {
    return await this.request(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async getProjectClips(id, params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/api/projects/${id}/clips${query ? '?' + query : ''}`);
  }

  async duplicateProject(id) {
    return await this.request(`/api/projects/${id}/duplicate`, {
      method: 'POST',
    });
  }

  // Video Processing
  async startVideoProcessing(projectId, videoUrl, title) {
    return await this.request('/api/processing/start', {
      method: 'POST',
      body: JSON.stringify({
        projectId,
        videoUrl,
        title,
      }),
    });
  }

  async getProcessingStatus(uploadId) {
    return await this.request(`/api/processing/status/${uploadId}`);
  }

  async cancelProcessing(uploadId) {
    return await this.request(`/api/processing/cancel/${uploadId}`, {
      method: 'POST',
    });
  }

  // Analytics
  async getDashboardAnalytics() {
    return await this.request('/api/analytics/dashboard');
  }

  // Billing
  async getSubscription() {
    return await this.request('/api/billing/subscription');
  }

  // Health Check
  async healthCheck() {
    return await this.request('/health');
  }

  // Utility methods
  isAuthenticated() {
    return !!this.token;
  }

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}

export default new ApiService();
