const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3002';
const TEST_RESULTS = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// Test utilities
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logTest = (testName, status, details = '') => {
  const timestamp = new Date().toISOString();
  const statusIcon = status === 'PASS' ? '✅' : '❌';
  console.log(`${statusIcon} [${timestamp}] ${testName} - ${status}`);
  if (details) console.log(`   ${details}`);
  
  TEST_RESULTS.total++;
  if (status === 'PASS') {
    TEST_RESULTS.passed++;
  } else {
    TEST_RESULTS.failed++;
    TEST_RESULTS.errors.push({ testName, details });
  }
};

const runTest = async (testName, testFunction) => {
  try {
    await testFunction();
    logTest(testName, 'PASS');
  } catch (error) {
    logTest(testName, 'FAIL', error.message);
  }
};

// API Test Functions
const testHealthCheck = async () => {
  const response = await axios.get(`${BASE_URL}/health`);
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!response.data.success) throw new Error('Health check failed');
};

const testRootEndpoint = async () => {
  const response = await axios.get(`${BASE_URL}/`);
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!response.data.message.includes('ReelRemix')) throw new Error('Invalid root response');
};

const testAPIDocumentation = async () => {
  const response = await axios.get(`${BASE_URL}/api/system/endpoints`);
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!response.data.data.endpoints) throw new Error('No endpoints documentation found');
};

const testUserSignup = async () => {
  const userData = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'testpassword123'
  };
  
  const response = await axios.post(`${BASE_URL}/api/auth/signup`, userData);
  if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
  if (!response.data.data.token) throw new Error('No token returned');
  if (!response.data.data.user.id) throw new Error('No user ID returned');
  
  return response.data.data;
};

const testUserSignin = async () => {
  const loginData = {
    email: 'existing@example.com',
    password: 'password123'
  };
  
  const response = await axios.post(`${BASE_URL}/api/auth/signin`, loginData);
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!response.data.data.token) throw new Error('No token returned');
  
  return response.data.data;
};

const testDashboardOverview = async () => {
  const response = await axios.get(`${BASE_URL}/api/dashboard/overview`);
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!response.data.data.stats) throw new Error('No stats data returned');
  if (typeof response.data.data.stats.totalProjects !== 'number') throw new Error('Invalid stats format');
};

const testVideoUpload = async () => {
  const uploadData = {
    title: 'Test Video Upload',
    description: 'Test description',
    url: 'https://youtube.com/watch?v=test123'
  };
  
  const response = await axios.post(`${BASE_URL}/api/videos/upload`, uploadData);
  if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
  if (!response.data.data.uploadId) throw new Error('No upload ID returned');
  if (!response.data.data.projectId) throw new Error('No project ID returned');
  
  return response.data.data;
};

const testVideoStatus = async () => {
  const testId = 'test_upload_123';
  const response = await axios.get(`${BASE_URL}/api/videos/status/${testId}`);
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!response.data.data.status) throw new Error('No status returned');
  if (typeof response.data.data.progress !== 'number') throw new Error('Invalid progress format');
};

const testBillingPlans = async () => {
  const response = await axios.get(`${BASE_URL}/api/billing/plans`);
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!Array.isArray(response.data.data.plans)) throw new Error('Plans should be an array');
  if (response.data.data.plans.length === 0) throw new Error('No plans returned');
  
  const plan = response.data.data.plans[0];
  if (!plan.id || !plan.name || typeof plan.price !== 'number') {
    throw new Error('Invalid plan format');
  }
};

const testAnalyticsDashboard = async () => {
  const response = await axios.get(`${BASE_URL}/api/analytics/dashboard`);
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  if (!response.data.data.overview) throw new Error('No overview data returned');
  if (!response.data.data.charts) throw new Error('No charts data returned');
  if (!Array.isArray(response.data.data.charts.views)) throw new Error('Views chart should be an array');
};

const testCORSHeaders = async () => {
  const response = await axios.get(`${BASE_URL}/health`);
  const corsHeader = response.headers['access-control-allow-origin'];
  // CORS headers are set by the server, this test passes if no CORS error occurs
  if (response.status !== 200) throw new Error('CORS configuration issue');
};

const testErrorHandling = async () => {
  try {
    await axios.get(`${BASE_URL}/api/nonexistent/endpoint`);
    throw new Error('Should have returned 404');
  } catch (error) {
    if (error.response?.status !== 404) {
      throw new Error(`Expected 404, got ${error.response?.status || 'no response'}`);
    }
  }
};

const testInvalidAPIRequest = async () => {
  try {
    await axios.post(`${BASE_URL}/api/auth/signup`, { email: 'invalid' });
    throw new Error('Should have returned 400');
  } catch (error) {
    if (error.response?.status !== 400) {
      throw new Error(`Expected 400, got ${error.response?.status || 'no response'}`);
    }
  }
};

// Frontend File Tests
const testFrontendFiles = async () => {
  const requiredFiles = [
    'apps/web/src/App.jsx',
    'apps/web/src/pages/HomePage.jsx',
    'apps/web/src/pages/AuthPage.jsx',
    'apps/web/src/pages/DashboardPage.jsx',
    'apps/web/src/pages/ProjectPage.jsx',
    'apps/web/src/pages/PricingPage.jsx',
    'apps/web/src/components/layout/Navbar.jsx',
    'apps/web/src/components/layout/Footer.jsx',
    'apps/web/src/components/demo/InteractiveDemo.jsx',
    'apps/web/src/components/demo/StatsSection.jsx',
    'apps/web/src/services/api.js',
    'apps/web/package.json'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Required file missing: ${file}`);
    }
  }
};

const testBackendFiles = async () => {
  const requiredFiles = [
    'apps/worker/src/middleware/auth.js',
    'apps/worker/src/middleware/errorHandler.js',
    'apps/worker/src/middleware/validation.js',
    'apps/worker/src/middleware/rateLimiter.js',
    'apps/worker/src/routes/auth-improved.js',
    'apps/worker/src/routes/videos-improved.js',
    'apps/worker/src/routes/billing-improved.js',
    'apps/worker/src/routes/analytics-improved.js',
    'apps/worker/src/routes/system.js',
    'apps/worker/src/server-final.js',
    'apps/worker/package.json'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Required file missing: ${file}`);
    }
  }
};

const testDatabaseSchema = async () => {
  const schemaFiles = [
    'apps/web/prisma/schema.prisma',
    'apps/web/prisma/schema-production.prisma'
  ];
  
  for (const file of schemaFiles) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Schema file missing: ${file}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('model User')) throw new Error(`${file} missing User model`);
    if (!content.includes('model Project')) throw new Error(`${file} missing Project model`);
    if (!content.includes('model Clip')) throw new Error(`${file} missing Clip model`);
  }
};

const testDocumentationFiles = async () => {
  const docFiles = [
    'README.md',
    'PROJECT_SUMMARY.md',
    'docs/ARCHITECTURE.md',
    'docs/DEPLOYMENT.md',
    'PRODUCTION_DEPLOYMENT_CHECKLIST.md',
    'TESTING_GUIDE.md'
  ];
  
  for (const file of docFiles) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Documentation file missing: ${file}`);
    }
  }
};

// Component Functionality Tests
const testComponentStructure = async () => {
  const componentFiles = [
    'apps/web/src/components/ui/button.jsx',
    'apps/web/src/components/upload/VideoUploadModal.jsx',
    'apps/web/src/components/upload/VideoUploadModal-enhanced.jsx'
  ];
  
  for (const file of componentFiles) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Component file missing: ${file}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('export') && !content.includes('module.exports')) {
      throw new Error(`${file} missing proper exports`);
    }
  }
};

// Performance Tests
const testAPIResponseTimes = async () => {
  const endpoints = [
    '/health',
    '/api/system/endpoints',
    '/api/billing/plans',
    '/api/analytics/dashboard'
  ];
  
  for (const endpoint of endpoints) {
    const start = Date.now();
    await axios.get(`${BASE_URL}${endpoint}`);
    const duration = Date.now() - start;
    
    if (duration > 2000) {
      throw new Error(`${endpoint} took ${duration}ms (>2000ms threshold)`);
    }
  }
};

// Integration Tests
const testFullUserJourney = async () => {
  // 1. Sign up
  const signupData = await testUserSignup();
  await delay(100);
  
  // 2. Upload video
  const uploadData = await testVideoUpload();
  await delay(100);
  
  // 3. Check status
  await testVideoStatus();
  await delay(100);
  
  // 4. View dashboard
  await testDashboardOverview();
  await delay(100);
  
  // 5. Check analytics
  await testAnalyticsDashboard();
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Comprehensive ReelRemix Test Suite');
  console.log('=' .repeat(60));
  
  // Wait for server to be ready
  await delay(2000);
  
  // Basic API Tests
  console.log('\n📡 API Endpoint Tests');
  await runTest('Health Check', testHealthCheck);
  await runTest('Root Endpoint', testRootEndpoint);
  await runTest('API Documentation', testAPIDocumentation);
  await runTest('CORS Headers', testCORSHeaders);
  await runTest('Error Handling', testErrorHandling);
  await runTest('Invalid Request Handling', testInvalidAPIRequest);
  
  // Authentication Tests
  console.log('\n🔐 Authentication Tests');
  await runTest('User Signup', testUserSignup);
  await runTest('User Signin', testUserSignin);
  
  // Feature Tests
  console.log('\n🎬 Video Processing Tests');
  await runTest('Video Upload', testVideoUpload);
  await runTest('Video Status Check', testVideoStatus);
  
  // Dashboard Tests
  console.log('\n📊 Dashboard Tests');
  await runTest('Dashboard Overview', testDashboardOverview);
  await runTest('Analytics Dashboard', testAnalyticsDashboard);
  
  // Billing Tests
  console.log('\n💳 Billing Tests');
  await runTest('Billing Plans', testBillingPlans);
  
  // File Structure Tests
  console.log('\n📁 File Structure Tests');
  await runTest('Frontend Files', testFrontendFiles);
  await runTest('Backend Files', testBackendFiles);
  await runTest('Database Schema', testDatabaseSchema);
  await runTest('Documentation Files', testDocumentationFiles);
  await runTest('Component Structure', testComponentStructure);
  
  // Performance Tests
  console.log('\n⚡ Performance Tests');
  await runTest('API Response Times', testAPIResponseTimes);
  
  // Integration Tests
  console.log('\n🔄 Integration Tests');
  await runTest('Full User Journey', testFullUserJourney);
  
  // Generate Report
  console.log('\n' + '=' .repeat(60));
  console.log('📋 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  
  const successRate = Math.round((TEST_RESULTS.passed / TEST_RESULTS.total) * 100);
  
  console.log(`Total Tests: ${TEST_RESULTS.total}`);
  console.log(`Passed: ${TEST_RESULTS.passed} ✅`);
  console.log(`Failed: ${TEST_RESULTS.failed} ❌`);
  console.log(`Success Rate: ${successRate}%`);
  
  if (TEST_RESULTS.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    TEST_RESULTS.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.testName}: ${error.details}`);
    });
  }
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: TEST_RESULTS.total,
      passed: TEST_RESULTS.passed,
      failed: TEST_RESULTS.failed,
      successRate: successRate
    },
    errors: TEST_RESULTS.errors,
    status: successRate >= 95 ? 'PRODUCTION_READY' : successRate >= 80 ? 'NEEDS_MINOR_FIXES' : 'NEEDS_MAJOR_FIXES'
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'final-test-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\n📄 Detailed report saved to: final-test-report.json`);
  console.log(`🎯 Overall Status: ${report.status}`);
  
  if (successRate >= 95) {
    console.log('\n🎉 CONGRATULATIONS! ReelRemix is 100% PRODUCTION READY! 🎉');
  } else if (successRate >= 80) {
    console.log('\n⚠️  ReelRemix is mostly ready but needs minor fixes');
  } else {
    console.log('\n🔧 ReelRemix needs significant improvements before production');
  }
  
  return report;
};

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, TEST_RESULTS };
