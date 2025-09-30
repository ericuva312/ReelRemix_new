// Integration Tests for ReelRemix Platform
// Tests the complete integration between frontend, backend, AI service, and external services

const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')

// Test configuration
const config = {
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  api: {
    url: process.env.API_URL || 'http://localhost:3001',
  },
  aiService: {
    url: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  },
  testUser: {
    email: 'test@reelremix.com',
    password: 'TestPassword123!',
    name: 'Test User',
  },
  testVideo: {
    path: path.join(__dirname, '../fixtures/sample-video.mp4'),
    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
  },
}

// Test utilities
class TestRunner {
  constructor() {
    this.results = []
    this.authToken = null
    this.userId = null
  }

  async runTest(name, testFn) {
    console.log(`\n🧪 Running test: ${name}`)
    const startTime = Date.now()
    
    try {
      await testFn()
      const duration = Date.now() - startTime
      console.log(`✅ ${name} - PASSED (${duration}ms)`)
      this.results.push({ name, status: 'PASSED', duration })
    } catch (error) {
      const duration = Date.now() - startTime
      console.log(`❌ ${name} - FAILED (${duration}ms)`)
      console.log(`   Error: ${error.message}`)
      this.results.push({ name, status: 'FAILED', duration, error: error.message })
    }
  }

  async runAllTests() {
    console.log('🚀 Starting ReelRemix Integration Tests\n')
    
    // Health checks
    await this.runTest('Frontend Health Check', () => this.testFrontendHealth())
    await this.runTest('API Health Check', () => this.testApiHealth())
    await this.runTest('AI Service Health Check', () => this.testAiServiceHealth())
    
    // Authentication flow
    await this.runTest('User Registration', () => this.testUserRegistration())
    await this.runTest('User Login', () => this.testUserLogin())
    await this.runTest('JWT Token Validation', () => this.testTokenValidation())
    
    // Core functionality
    await this.runTest('Video Upload', () => this.testVideoUpload())
    await this.runTest('Video Processing Pipeline', () => this.testVideoProcessing())
    await this.runTest('AI Analysis Integration', () => this.testAiAnalysis())
    await this.runTest('Clip Generation', () => this.testClipGeneration())
    
    // Payment integration
    await this.runTest('Stripe Integration', () => this.testStripeIntegration())
    await this.runTest('Subscription Management', () => this.testSubscriptionManagement())
    
    // Analytics and monitoring
    await this.runTest('Analytics Tracking', () => this.testAnalyticsTracking())
    await this.runTest('Performance Monitoring', () => this.testPerformanceMonitoring())
    
    // Error handling
    await this.runTest('Error Handling', () => this.testErrorHandling())
    await this.runTest('Rate Limiting', () => this.testRateLimiting())
    
    this.printResults()
  }

  // Health check tests
  async testFrontendHealth() {
    const response = await axios.get(config.frontend.url)
    if (response.status !== 200) {
      throw new Error(`Frontend health check failed: ${response.status}`)
    }
  }

  async testApiHealth() {
    const response = await axios.get(`${config.api.url}/health`)
    if (response.status !== 200 || response.data.status !== 'healthy') {
      throw new Error(`API health check failed: ${response.status}`)
    }
  }

  async testAiServiceHealth() {
    const response = await axios.get(`${config.aiService.url}/health`)
    if (response.status !== 200) {
      throw new Error(`AI service health check failed: ${response.status}`)
    }
  }

  // Authentication tests
  async testUserRegistration() {
    const response = await axios.post(`${config.api.url}/api/auth/register`, {
      email: config.testUser.email,
      password: config.testUser.password,
      name: config.testUser.name,
    })
    
    if (response.status !== 201) {
      throw new Error(`Registration failed: ${response.status}`)
    }
    
    if (!response.data.user || !response.data.token) {
      throw new Error('Registration response missing user or token')
    }
    
    this.authToken = response.data.token
    this.userId = response.data.user.id
  }

  async testUserLogin() {
    const response = await axios.post(`${config.api.url}/api/auth/login`, {
      email: config.testUser.email,
      password: config.testUser.password,
    })
    
    if (response.status !== 200) {
      throw new Error(`Login failed: ${response.status}`)
    }
    
    if (!response.data.token) {
      throw new Error('Login response missing token')
    }
    
    this.authToken = response.data.token
  }

  async testTokenValidation() {
    const response = await axios.get(`${config.api.url}/api/auth/me`, {
      headers: { Authorization: `Bearer ${this.authToken}` }
    })
    
    if (response.status !== 200) {
      throw new Error(`Token validation failed: ${response.status}`)
    }
    
    if (response.data.email !== config.testUser.email) {
      throw new Error('Token validation returned wrong user')
    }
  }

  // Core functionality tests
  async testVideoUpload() {
    // Create a test video file if it doesn't exist
    if (!fs.existsSync(config.testVideo.path)) {
      // Download sample video
      const response = await axios.get(config.testVideo.url, { responseType: 'stream' })
      const writer = fs.createWriteStream(config.testVideo.path)
      response.data.pipe(writer)
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
      })
    }
    
    const formData = new FormData()
    formData.append('video', fs.createReadStream(config.testVideo.path))
    formData.append('title', 'Test Video')
    formData.append('description', 'Integration test video')
    
    const response = await axios.post(`${config.api.url}/api/projects/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${this.authToken}`
      }
    })
    
    if (response.status !== 201) {
      throw new Error(`Video upload failed: ${response.status}`)
    }
    
    if (!response.data.projectId) {
      throw new Error('Video upload response missing project ID')
    }
    
    this.projectId = response.data.projectId
  }

  async testVideoProcessing() {
    // Wait for processing to start
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const response = await axios.get(`${config.api.url}/api/projects/${this.projectId}`, {
      headers: { Authorization: `Bearer ${this.authToken}` }
    })
    
    if (response.status !== 200) {
      throw new Error(`Project fetch failed: ${response.status}`)
    }
    
    const project = response.data
    if (!['processing', 'completed', 'failed'].includes(project.status)) {
      throw new Error(`Invalid project status: ${project.status}`)
    }
    
    // If still processing, wait and check again
    if (project.status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 10000))
      return this.testVideoProcessing()
    }
    
    if (project.status === 'failed') {
      throw new Error('Video processing failed')
    }
  }

  async testAiAnalysis() {
    // Test direct AI service integration
    const testData = {
      text: "This is a test transcript for viral analysis",
      duration: 60,
      segments: [
        { start: 0, end: 30, text: "First segment" },
        { start: 30, end: 60, text: "Second segment" }
      ]
    }
    
    const response = await axios.post(`${config.aiService.url}/analyze`, testData)
    
    if (response.status !== 200) {
      throw new Error(`AI analysis failed: ${response.status}`)
    }
    
    if (!response.data.segments || !response.data.viralScore) {
      throw new Error('AI analysis response missing required fields')
    }
  }

  async testClipGeneration() {
    const response = await axios.get(`${config.api.url}/api/projects/${this.projectId}/clips`, {
      headers: { Authorization: `Bearer ${this.authToken}` }
    })
    
    if (response.status !== 200) {
      throw new Error(`Clips fetch failed: ${response.status}`)
    }
    
    if (!Array.isArray(response.data) || response.data.length === 0) {
      throw new Error('No clips generated')
    }
    
    const clip = response.data[0]
    if (!clip.id || !clip.viralScore || !clip.startTime || !clip.endTime) {
      throw new Error('Clip missing required fields')
    }
  }

  // Payment integration tests
  async testStripeIntegration() {
    const response = await axios.post(`${config.api.url}/api/billing/create-checkout-session`, {
      planId: 'starter',
      successUrl: 'https://reelremix.com/success',
      cancelUrl: 'https://reelremix.com/cancel'
    }, {
      headers: { Authorization: `Bearer ${this.authToken}` }
    })
    
    if (response.status !== 200) {
      throw new Error(`Stripe checkout creation failed: ${response.status}`)
    }
    
    if (!response.data.sessionId || !response.data.url) {
      throw new Error('Stripe checkout response missing required fields')
    }
  }

  async testSubscriptionManagement() {
    const response = await axios.get(`${config.api.url}/api/billing/subscription`, {
      headers: { Authorization: `Bearer ${this.authToken}` }
    })
    
    if (response.status !== 200) {
      throw new Error(`Subscription fetch failed: ${response.status}`)
    }
    
    // Should return subscription data or null for free users
    if (response.data !== null && !response.data.plan) {
      throw new Error('Invalid subscription response')
    }
  }

  // Analytics and monitoring tests
  async testAnalyticsTracking() {
    const eventData = {
      event: 'test_event',
      properties: {
        testProperty: 'testValue',
        timestamp: Date.now()
      }
    }
    
    const response = await axios.post(`${config.api.url}/api/analytics/track`, eventData, {
      headers: { Authorization: `Bearer ${this.authToken}` }
    })
    
    if (response.status !== 200) {
      throw new Error(`Analytics tracking failed: ${response.status}`)
    }
  }

  async testPerformanceMonitoring() {
    const response = await axios.get(`${config.api.url}/api/monitoring/performance`)
    
    if (response.status !== 200) {
      throw new Error(`Performance monitoring failed: ${response.status}`)
    }
    
    if (!response.data.metrics) {
      throw new Error('Performance monitoring response missing metrics')
    }
  }

  // Error handling tests
  async testErrorHandling() {
    try {
      await axios.get(`${config.api.url}/api/nonexistent-endpoint`)
      throw new Error('Expected 404 error but request succeeded')
    } catch (error) {
      if (error.response?.status !== 404) {
        throw new Error(`Expected 404 but got ${error.response?.status}`)
      }
    }
    
    try {
      await axios.post(`${config.api.url}/api/auth/login`, {
        email: 'invalid@email.com',
        password: 'wrongpassword'
      })
      throw new Error('Expected authentication error but request succeeded')
    } catch (error) {
      if (error.response?.status !== 401) {
        throw new Error(`Expected 401 but got ${error.response?.status}`)
      }
    }
  }

  async testRateLimiting() {
    const requests = []
    
    // Make multiple rapid requests to trigger rate limiting
    for (let i = 0; i < 20; i++) {
      requests.push(axios.get(`${config.api.url}/health`))
    }
    
    try {
      await Promise.all(requests)
    } catch (error) {
      if (error.response?.status === 429) {
        // Rate limiting is working
        return
      }
    }
    
    // If we get here, rate limiting might not be working
    console.warn('⚠️  Rate limiting may not be properly configured')
  }

  printResults() {
    console.log('\n📊 Integration Test Results')
    console.log('=' * 50)
    
    const passed = this.results.filter(r => r.status === 'PASSED').length
    const failed = this.results.filter(r => r.status === 'FAILED').length
    const total = this.results.length
    
    console.log(`Total Tests: ${total}`)
    console.log(`Passed: ${passed}`)
    console.log(`Failed: ${failed}`)
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:')
      this.results
        .filter(r => r.status === 'FAILED')
        .forEach(r => console.log(`   - ${r.name}: ${r.error}`))
    }
    
    console.log('\n⏱️  Performance Summary:')
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total
    console.log(`Average Test Duration: ${avgDuration.toFixed(0)}ms`)
    
    const slowTests = this.results
      .filter(r => r.duration > 5000)
      .sort((a, b) => b.duration - a.duration)
    
    if (slowTests.length > 0) {
      console.log('\n🐌 Slow Tests (>5s):')
      slowTests.forEach(r => console.log(`   - ${r.name}: ${r.duration}ms`))
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new TestRunner()
  runner.runAllTests()
    .then(() => {
      const failed = runner.results.filter(r => r.status === 'FAILED').length
      process.exit(failed > 0 ? 1 : 0)
    })
    .catch(error => {
      console.error('Test runner failed:', error)
      process.exit(1)
    })
}

module.exports = TestRunner
