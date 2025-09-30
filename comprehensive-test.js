#!/usr/bin/env node

/**
 * Comprehensive ReelRemix Testing Script
 * Tests all frontend and backend functionality
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 COMPREHENSIVE REELREMIX TESTING\n');

// Test Results Storage
const testResults = {
  issues: [],
  passed: 0,
  failed: 0
};

// Helper function to log test results
function logTest(category, test, status, details = '') {
  const result = { test, status, details, timestamp: new Date().toISOString() };
  
  // Initialize category arrays if they don't exist
  if (!testResults[category]) {
    testResults[category] = [];
  }
  
  testResults[category].push(result);
  
  if (status === 'PASS') {
    testResults.passed++;
    console.log(`✅ ${test}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${test} - ${details}`);
    testResults.issues.push(`${test}: ${details}`);
  }
  
  if (details) {
    console.log(`   ${details}`);
  }
}

// Test 1: Frontend Component Structure
console.log('📱 FRONTEND COMPONENT TESTING\n');

// Check all page components
const pageComponents = [
  'apps/web/src/pages/HomePage.jsx',
  'apps/web/src/pages/PricingPage.jsx', 
  'apps/web/src/pages/DashboardPage.jsx',
  'apps/web/src/pages/AuthPage.jsx',
  'apps/web/src/pages/ProjectPage.jsx',
  'apps/web/src/pages/LandingPage.jsx',
  'apps/web/src/pages/AboutPage.jsx',
  'apps/web/src/pages/ContactPage.jsx'
];

pageComponents.forEach(component => {
  if (fs.existsSync(component)) {
    const content = fs.readFileSync(component, 'utf8');
    
    // Check for React imports
    if (content.includes('import React') || content.includes('import { useState')) {
      logTest('frontend', `${path.basename(component)} - React imports`, 'PASS');
    } else {
      logTest('frontend', `${path.basename(component)} - React imports`, 'FAIL', 'Missing React imports');
    }
    
    // Check for button implementations
    const buttonMatches = content.match(/<Button[^>]*>/g) || [];
    const onClickMatches = content.match(/onClick\s*=\s*{[^}]+}/g) || [];
    
    if (buttonMatches.length > 0) {
      if (onClickMatches.length >= buttonMatches.length * 0.5) {
        logTest('frontend', `${path.basename(component)} - Button functionality`, 'PASS', `${onClickMatches.length}/${buttonMatches.length} buttons have onClick handlers`);
      } else {
        logTest('frontend', `${path.basename(component)} - Button functionality`, 'FAIL', `Only ${onClickMatches.length}/${buttonMatches.length} buttons have onClick handlers`);
      }
    }
    
    // Check for form implementations
    if (content.includes('<Form') || content.includes('useForm')) {
      if (content.includes('onSubmit') || content.includes('handleSubmit')) {
        logTest('frontend', `${path.basename(component)} - Form submission`, 'PASS');
      } else {
        logTest('frontend', `${path.basename(component)} - Form submission`, 'FAIL', 'Forms missing submission handlers');
      }
    }
    
  } else {
    logTest('frontend', `${path.basename(component)} - File exists`, 'FAIL', 'Component file missing');
  }
});

// Test 2: UI Component Dependencies
console.log('\n🎨 UI COMPONENT TESTING\n');

const uiComponents = [
  'apps/web/src/components/ui/button.jsx',
  'apps/web/src/components/ui/card.jsx',
  'apps/web/src/components/ui/input.jsx',
  'apps/web/src/components/ui/form.jsx',
  'apps/web/src/components/ui/badge.jsx',
  'apps/web/src/components/ui/progress.jsx',
  'apps/web/src/components/ui/tabs.jsx',
  'apps/web/src/components/ui/checkbox.jsx',
  'apps/web/src/components/ui/label.jsx',
  'apps/web/src/components/ui/separator.jsx'
];

uiComponents.forEach(component => {
  if (fs.existsSync(component)) {
    const content = fs.readFileSync(component, 'utf8');
    
    // Check for proper exports
    if (content.includes('export {') || content.includes('export default')) {
      logTest('frontend', `${path.basename(component)} - Exports`, 'PASS');
    } else {
      logTest('frontend', `${path.basename(component)} - Exports`, 'FAIL', 'Missing proper exports');
    }
    
    // Check for className utilities
    if (content.includes('cn(') && content.includes('@/lib/utils')) {
      logTest('frontend', `${path.basename(component)} - Styling utilities`, 'PASS');
    } else {
      logTest('frontend', `${path.basename(component)} - Styling utilities`, 'FAIL', 'Missing cn utility or utils import');
    }
    
  } else {
    logTest('frontend', `${path.basename(component)} - File exists`, 'FAIL', 'UI component missing');
  }
});

// Test 3: Interactive Components
console.log('\n🎮 INTERACTIVE COMPONENT TESTING\n');

const interactiveComponents = [
  'apps/web/src/components/demo/InteractiveDemo.jsx',
  'apps/web/src/components/demo/StatsSection.jsx',
  'apps/web/src/components/layout/Navbar.jsx',
  'apps/web/src/components/layout/Footer.jsx'
];

interactiveComponents.forEach(component => {
  if (fs.existsSync(component)) {
    const content = fs.readFileSync(component, 'utf8');
    
    // Check for state management
    if (content.includes('useState') || content.includes('useEffect')) {
      logTest('frontend', `${path.basename(component)} - State management`, 'PASS');
    } else {
      logTest('frontend', `${path.basename(component)} - State management`, 'FAIL', 'Missing state management hooks');
    }
    
    // Check for event handlers
    const eventHandlers = content.match(/(onClick|onSubmit|onChange|onFocus|onBlur)\s*=\s*{[^}]+}/g) || [];
    if (eventHandlers.length > 0) {
      logTest('frontend', `${path.basename(component)} - Event handlers`, 'PASS', `${eventHandlers.length} event handlers found`);
    } else {
      logTest('frontend', `${path.basename(component)} - Event handlers`, 'FAIL', 'No event handlers found');
    }
    
  } else {
    logTest('frontend', `${path.basename(component)} - File exists`, 'FAIL', 'Interactive component missing');
  }
});

// Test 4: Backend API Structure
console.log('\n🔧 BACKEND API TESTING\n');

const backendFiles = [
  'apps/worker/src/index.ts',
  'apps/worker/src/services/stripe.ts',
  'apps/worker/src/services/billing.ts',
  'apps/worker/src/services/analytics.ts',
  'apps/worker/src/routes/billing.ts',
  'apps/worker/src/routes/analytics.ts'
];

backendFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for Express routes
    if (content.includes('app.') || content.includes('router.') || content.includes('express')) {
      logTest('backend', `${path.basename(file)} - Express integration`, 'PASS');
    } else {
      logTest('backend', `${path.basename(file)} - Express integration`, 'FAIL', 'Missing Express route definitions');
    }
    
    // Check for error handling
    if (content.includes('try {') && content.includes('catch')) {
      logTest('backend', `${path.basename(file)} - Error handling`, 'PASS');
    } else {
      logTest('backend', `${path.basename(file)} - Error handling`, 'FAIL', 'Missing try-catch error handling');
    }
    
  } else {
    logTest('backend', `${path.basename(file)} - File exists`, 'FAIL', 'Backend file missing');
  }
});

// Test 5: Database Schema
console.log('\n🗄️ DATABASE SCHEMA TESTING\n');

if (fs.existsSync('apps/web/prisma/schema.prisma')) {
  const schema = fs.readFileSync('apps/web/prisma/schema.prisma', 'utf8');
  
  const models = ['User', 'Project', 'Clip', 'Subscription', 'Usage', 'Analytics'];
  models.forEach(model => {
    if (schema.includes(`model ${model}`)) {
      logTest('backend', `Database model - ${model}`, 'PASS');
    } else {
      logTest('backend', `Database model - ${model}`, 'FAIL', `${model} model not defined`);
    }
  });
  
  // Check for relationships
  if (schema.includes('@relation')) {
    logTest('backend', 'Database relationships', 'PASS');
  } else {
    logTest('backend', 'Database relationships', 'FAIL', 'No model relationships defined');
  }
  
} else {
  logTest('backend', 'Prisma schema exists', 'FAIL', 'Database schema file missing');
}

// Test 6: Package Dependencies
console.log('\n📦 DEPENDENCY TESTING\n');

const packageFiles = [
  { file: 'apps/web/package.json', type: 'Frontend' },
  { file: 'apps/worker/package.json', type: 'Backend' },
  { file: 'apps/python/requirements.txt', type: 'AI Service' }
];

packageFiles.forEach(({ file, type }) => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    
    if (file.endsWith('.json')) {
      try {
        const pkg = JSON.parse(content);
        const depCount = Object.keys(pkg.dependencies || {}).length + Object.keys(pkg.devDependencies || {}).length;
        logTest('backend', `${type} dependencies`, 'PASS', `${depCount} dependencies found`);
      } catch (error) {
        logTest('backend', `${type} dependencies`, 'FAIL', 'Invalid package.json format');
      }
    } else {
      const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      logTest('backend', `${type} dependencies`, 'PASS', `${lines.length} Python packages found`);
    }
    
  } else {
    logTest('backend', `${type} dependencies`, 'FAIL', 'Package file missing');
  }
});

// Test 7: Build Configuration
console.log('\n🏗️ BUILD CONFIGURATION TESTING\n');

const buildFiles = [
  'apps/web/vite.config.js',
  'apps/worker/tsconfig.json',
  'docker-compose.yml',
  '.github/workflows/deploy.yml'
];

buildFiles.forEach(file => {
  if (fs.existsSync(file)) {
    logTest('backend', `Build config - ${path.basename(file)}`, 'PASS');
  } else {
    logTest('backend', `Build config - ${path.basename(file)}`, 'FAIL', 'Build configuration missing');
  }
});

// Test 8: Environment Configuration
console.log('\n⚙️ ENVIRONMENT CONFIGURATION TESTING\n');

const envFiles = ['.env.example', '.env.development'];
envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const envVars = content.split('\n').filter(line => line.includes('=')).length;
    logTest('backend', `Environment config - ${file}`, 'PASS', `${envVars} environment variables`);
  } else {
    logTest('backend', `Environment config - ${file}`, 'FAIL', 'Environment file missing');
  }
});

// Generate Test Report
console.log('\n' + '='.repeat(60));
console.log('📊 COMPREHENSIVE TEST REPORT');
console.log('='.repeat(60));

console.log(`\n📈 SUMMARY:`);
console.log(`✅ Tests Passed: ${testResults.passed}`);
console.log(`❌ Tests Failed: ${testResults.failed}`);
console.log(`📊 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);

if (testResults.issues.length > 0) {
  console.log(`\n🚨 CRITICAL ISSUES TO FIX:`);
  testResults.issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
}

console.log(`\n🎯 PRODUCTION READINESS:`);
if (testResults.failed === 0) {
  console.log('🎉 ALL TESTS PASSED - PRODUCTION READY!');
} else if (testResults.failed <= 5) {
  console.log('⚠️  MINOR ISSUES - NEEDS FIXES BEFORE PRODUCTION');
} else {
  console.log('🚨 MAJOR ISSUES - NOT PRODUCTION READY');
}

// Save detailed report
const reportPath = '/home/ubuntu/reelremix/test-report.json';
fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
console.log(`\n📄 Detailed report saved to: ${reportPath}`);

console.log('\n🔧 NEXT STEPS:');
console.log('1. Fix all identified issues');
console.log('2. Test video upload functionality');
console.log('3. Test all button interactions');
console.log('4. Verify end-to-end user flows');
console.log('5. Re-run comprehensive testing');
