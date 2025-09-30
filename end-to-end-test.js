#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3002';
let authToken = null;
let testResults = [];

// Test configuration
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'testpassword123'
};

const testVideo = {
  title: 'Test Video Upload',
  description: 'Testing video processing functionality',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
};

// Helper functions
function logTest(testName, status, details = '') {
  const result = {
    test: testName,
    status,
    details,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);
  
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${statusIcon} ${testName}: ${status}${details ? ` - ${details}` : ''}`);
}

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Test functions
async function testServerHealth() {
  console.log('\n🏥 TESTING SERVER HEALTH');
  
  try {
    const response = await axios.get(BASE_URL);
    if (response.status === 200) {
      logTest('Server Health Check', 'PASS', 'Server is responding');
    } else {
      logTest('Server Health Check', 'FAIL', `Unexpected status: ${response.status}`);
    }
  } catch (error) {
    logTest('Server Health Check', 'FAIL', `Server not responding: ${error.message}`);
  }
}

async function testUserRegistration() {
  console.log('\n👤 TESTING USER REGISTRATION');
  
  const result = await makeRequest('POST', '/api/auth/signup', testUser);
  
  if (result.success && result.data.success) {
    authToken = result.data.token;
    logTest('User Registration', 'PASS', `User created with ID: ${result.data.user.id}`);
    return true;
  } else {
    logTest('User Registration', 'FAIL', result.error?.error || 'Registration failed');
    return false;
  }
}

async function testUserLogin() {
  console.log('\n🔐 TESTING USER LOGIN');
  
  const loginData = {
    email: testUser.email,
    password: testUser.password
  };
  
  const result = await makeRequest('POST', '/api/auth/signin', loginData);
  
  if (result.success && result.data.success) {
    authToken = result.data.token;
    logTest('User Login', 'PASS', `Logged in as: ${result.data.user.email}`);
    return true;
  } else {
    logTest('User Login', 'FAIL', result.error?.error || 'Login failed');
    return false;
  }
}

async function testUserProfile() {
  console.log('\n👥 TESTING USER PROFILE');
  
  const result = await makeRequest('GET', '/api/auth/profile');
  
  if (result.success && result.data.success) {
    logTest('Get User Profile', 'PASS', `Profile for: ${result.data.user.name}`);
    return true;
  } else {
    logTest('Get User Profile', 'FAIL', result.error?.error || 'Profile fetch failed');
    return false;
  }
}

async function testProjectCreation() {
  console.log('\n📁 TESTING PROJECT CREATION');
  
  const projectData = {
    title: testVideo.title,
    description: testVideo.description
  };
  
  const result = await makeRequest('POST', '/api/projects', projectData);
  
  if (result.success && result.data.success) {
    logTest('Project Creation', 'PASS', `Project created: ${result.data.project.id}`);
    return result.data.project;
  } else {
    logTest('Project Creation', 'FAIL', result.error?.error || 'Project creation failed');
    return null;
  }
}

async function testVideoProcessing(project) {
  console.log('\n🎬 TESTING VIDEO PROCESSING');
  
  if (!project) {
    logTest('Video Processing', 'SKIP', 'No project available');
    return false;
  }
  
  const processingData = {
    projectId: project.id,
    videoUrl: testVideo.url,
    title: testVideo.title
  };
  
  const result = await makeRequest('POST', '/api/processing/start', processingData);
  
  if (result.success && result.data.success) {
    logTest('Start Video Processing', 'PASS', `Upload ID: ${result.data.uploadId}`);
    
    // Test status checking
    const statusResult = await makeRequest('GET', `/api/processing/status/${result.data.uploadId}`);
    
    if (statusResult.success && statusResult.data.success) {
      logTest('Check Processing Status', 'PASS', `Status: ${statusResult.data.upload.status}`);
      return true;
    } else {
      logTest('Check Processing Status', 'FAIL', statusResult.error?.error || 'Status check failed');
      return false;
    }
  } else {
    logTest('Start Video Processing', 'FAIL', result.error?.error || 'Processing start failed');
    return false;
  }
}

async function testDashboardData() {
  console.log('\n📊 TESTING DASHBOARD DATA');
  
  // Test overview
  const overviewResult = await makeRequest('GET', '/api/dashboard/overview');
  
  if (overviewResult.success && overviewResult.data.success) {
    logTest('Dashboard Overview', 'PASS', `Projects: ${overviewResult.data.overview.totalProjects}`);
  } else {
    logTest('Dashboard Overview', 'FAIL', overviewResult.error?.error || 'Overview fetch failed');
  }
  
  // Test analytics
  const analyticsResult = await makeRequest('GET', '/api/dashboard/analytics');
  
  if (analyticsResult.success && analyticsResult.data.success) {
    logTest('Dashboard Analytics', 'PASS', `Views data points: ${analyticsResult.data.analytics.viewsOverTime.length}`);
  } else {
    logTest('Dashboard Analytics', 'FAIL', analyticsResult.error?.error || 'Analytics fetch failed');
  }
}

async function testProjectsList() {
  console.log('\n📋 TESTING PROJECTS LIST');
  
  const result = await makeRequest('GET', '/api/projects');
  
  if (result.success && result.data.success) {
    logTest('Get Projects List', 'PASS', `Found ${result.data.projects.length} projects`);
    return true;
  } else {
    logTest('Get Projects List', 'FAIL', result.error?.error || 'Projects list failed');
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n🚨 TESTING ERROR HANDLING');
  
  // Test unauthorized access
  const originalToken = authToken;
  authToken = 'invalid-token';
  
  const result = await makeRequest('GET', '/api/auth/profile');
  
  if (!result.success && result.status === 401) {
    logTest('Unauthorized Access Handling', 'PASS', 'Correctly rejected invalid token');
  } else {
    logTest('Unauthorized Access Handling', 'FAIL', 'Should have rejected invalid token');
  }
  
  // Restore token
  authToken = originalToken;
  
  // Test invalid endpoint
  const invalidResult = await makeRequest('GET', '/api/nonexistent');
  
  if (!invalidResult.success && invalidResult.status === 404) {
    logTest('Invalid Endpoint Handling', 'PASS', 'Correctly returned 404');
  } else {
    logTest('Invalid Endpoint Handling', 'FAIL', 'Should have returned 404');
  }
}

async function testFrontendPages() {
  console.log('\n🌐 TESTING FRONTEND PAGES');
  
  const pages = [
    { path: '/', name: 'Homepage' },
    { path: '/auth', name: 'Auth Page' },
    { path: '/pricing', name: 'Pricing Page' },
    { path: '/about', name: 'About Page' },
    { path: '/contact', name: 'Contact Page' }
  ];
  
  for (const page of pages) {
    try {
      const response = await axios.get(`${BASE_URL}${page.path}`);
      if (response.status === 200) {
        logTest(`${page.name} Load`, 'PASS', 'Page loaded successfully');
      } else {
        logTest(`${page.name} Load`, 'FAIL', `Status: ${response.status}`);
      }
    } catch (error) {
      logTest(`${page.name} Load`, 'FAIL', error.message);
    }
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 REELREMIX END-TO-END TESTING SUITE');
  console.log('=====================================');
  
  const startTime = Date.now();
  
  // Run tests in sequence
  await testServerHealth();
  
  const registrationSuccess = await testUserRegistration();
  if (!registrationSuccess) {
    // Try login instead
    await testUserLogin();
  }
  
  await testUserProfile();
  
  const project = await testProjectCreation();
  await testVideoProcessing(project);
  
  await testDashboardData();
  await testProjectsList();
  
  await testErrorHandling();
  await testFrontendPages();
  
  // Generate report
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  const passedTests = testResults.filter(r => r.status === 'PASS').length;
  const failedTests = testResults.filter(r => r.status === 'FAIL').length;
  const skippedTests = testResults.filter(r => r.status === 'SKIP').length;
  const totalTests = testResults.length;
  
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`⚠️  Skipped: ${skippedTests}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log(`⏱️  Duration: ${duration}s`);
  
  // Save detailed report
  const report = {
    summary: {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      successRate: Math.round((passedTests / totalTests) * 100),
      duration,
      timestamp: new Date().toISOString()
    },
    results: testResults
  };
  
  fs.writeFileSync('/home/ubuntu/reelremix/e2e-test-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved to: e2e-test-report.json');
  
  // Determine overall status
  if (failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED! ReelRemix is ready for production.');
    process.exit(0);
  } else if (passedTests / totalTests >= 0.8) {
    console.log('\n⚠️  MOSTLY WORKING - Some issues need attention before production.');
    process.exit(1);
  } else {
    console.log('\n🚨 CRITICAL ISSUES - Major fixes needed before production.');
    process.exit(2);
  }
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(3);
  });
}

module.exports = { runAllTests };
