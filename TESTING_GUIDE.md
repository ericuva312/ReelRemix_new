# ReelRemix Testing Guide

## 🧪 Complete Testing Strategy

This guide covers how to test ReelRemix at different levels to ensure everything works correctly before and after deployment.

## Local Development Testing

### 1. Frontend Testing

**Start the React Application:**
```bash
cd /home/ubuntu/reelremix/apps/web
npm run dev
```
**Access at:** http://localhost:5173

**Test Checklist:**
- [ ] Landing page loads correctly
- [ ] Navigation works between pages
- [ ] Pricing page displays plans correctly
- [ ] Dashboard shows mock data
- [ ] Forms validate input properly
- [ ] Responsive design works on mobile
- [ ] All buttons and links function
- [ ] Interactive demo animations work

### 2. Backend API Testing

**Start the API Server:**
```bash
cd /home/ubuntu/reelremix/apps/worker
npm run dev
```
**Access at:** http://localhost:3001

**Test API Endpoints:**
```bash
# Health check
curl http://localhost:3001/health

# Test authentication endpoints
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Test protected endpoints (with JWT token)
curl -X GET http://localhost:3001/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. AI Service Testing

**Start the Python Service:**
```bash
cd /home/ubuntu/reelremix/apps/python
source venv/bin/activate
uvicorn src.main:app --reload --port 8000
```
**Access at:** http://localhost:8000

**Test AI Endpoints:**
```bash
# Health check
curl http://localhost:8000/health

# Test transcription (with sample audio file)
curl -X POST http://localhost:8000/transcribe \
  -F "file=@sample_audio.mp3"

# Test viral scoring
curl -X POST http://localhost:8000/score \
  -H "Content-Type: application/json" \
  -d '{"transcript":"This is a sample transcript for testing"}'
```

## Integration Testing

### 1. Database Connection Testing

**Test Database Setup:**
```bash
cd /home/ubuntu/reelremix/apps/worker

# Test database connection
npx prisma db push

# Run migrations
npx prisma migrate dev

# Test queries
npx prisma studio
```

### 2. Full Stack Integration

**Run Integration Tests:**
```bash
cd /home/ubuntu/reelremix
node testing/integration/integration-tests.js
```

**Manual Integration Flow:**
1. Register new user → Verify JWT token generation
2. Login with credentials → Verify authentication
3. Upload video file → Verify file storage
4. Process video → Verify AI pipeline
5. Generate clips → Verify output files
6. Download clips → Verify file delivery

## Automated Testing

### 1. Unit Tests

**Frontend Tests:**
```bash
cd /home/ubuntu/reelremix/apps/web
npm test
```

**Backend Tests:**
```bash
cd /home/ubuntu/reelremix/apps/worker
npm test
```

**AI Service Tests:**
```bash
cd /home/ubuntu/reelremix/apps/python
python -m pytest tests/
```

### 2. End-to-End Tests

**Run E2E Tests:**
```bash
cd /home/ubuntu/reelremix
npm run test:e2e
```

## Performance Testing

### 1. Load Testing

**API Load Test:**
```bash
# Install artillery for load testing
npm install -g artillery

# Run load test
artillery run testing/performance/api-load-test.yml
```

**Frontend Performance:**
```bash
# Install lighthouse
npm install -g lighthouse

# Test performance
lighthouse http://localhost:5173 --output html --output-path ./performance-report.html
```

### 2. Video Processing Performance

**Test Video Processing Speed:**
```bash
# Time a video processing job
time curl -X POST http://localhost:8000/process \
  -F "file=@test_video.mp4"
```

## Security Testing

### 1. Authentication Testing

**Test JWT Security:**
```bash
# Test with invalid token
curl -X GET http://localhost:3001/api/projects \
  -H "Authorization: Bearer invalid_token"

# Test token expiration
curl -X GET http://localhost:3001/api/projects \
  -H "Authorization: Bearer expired_token"
```

### 2. Input Validation Testing

**Test SQL Injection Protection:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123; DROP TABLE users;"}'
```

**Test XSS Protection:**
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"<script>alert(\"XSS\")</script>"}'
```

## Production Testing

### 1. Health Monitoring

**Run Health Checks:**
```bash
node /home/ubuntu/reelremix/scripts/health-check.js
```

**Expected Output:**
```
✅ Frontend: Healthy (150ms)
✅ API: Healthy (45ms)
✅ AI Service: Healthy (120ms)
✅ Database: Healthy (25ms)
✅ Redis: Healthy (15ms)
✅ System Resources: Healthy
```

### 2. Configuration Validation

**Validate Environment:**
```bash
node /home/ubuntu/reelremix/scripts/validate-config.js
```

**Expected Output:**
```
✅ All critical validations passed! Ready for deployment.
```

## User Acceptance Testing

### 1. Complete User Journey

**Test the full user experience:**

1. **Landing Page Visit**
   - Load homepage
   - Watch demo video
   - View pricing plans
   - Click "Start Free Trial"

2. **User Registration**
   - Fill registration form
   - Verify email validation
   - Complete account setup
   - Receive welcome email

3. **First Video Upload**
   - Upload sample video file
   - Monitor processing progress
   - View processing status
   - Receive completion notification

4. **Clip Management**
   - View generated clips
   - Preview clips in browser
   - Download clips
   - Share clips on social media

5. **Subscription Management**
   - View current plan
   - Upgrade subscription
   - Process payment
   - Access premium features

### 2. Browser Compatibility

**Test across browsers:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### 3. Device Testing

**Test responsive design:**
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Large mobile (414x896)

## Sample Test Data

### Test Video Files

**Create sample test files:**
```bash
# Create test video directory
mkdir -p /home/ubuntu/reelremix/test-data

# Download sample videos (or create with ffmpeg)
# Short video (30 seconds)
ffmpeg -f lavfi -i testsrc=duration=30:size=1280x720:rate=30 \
  -f lavfi -i sine=frequency=1000:duration=30 \
  -c:v libx264 -c:a aac -shortest test-data/short_video.mp4

# Medium video (5 minutes)
ffmpeg -f lavfi -i testsrc=duration=300:size=1280x720:rate=30 \
  -f lavfi -i sine=frequency=1000:duration=300 \
  -c:v libx264 -c:a aac -shortest test-data/medium_video.mp4
```

### Test User Accounts

**Create test users:**
```json
{
  "testUsers": [
    {
      "email": "creator@test.com",
      "password": "TestPassword123!",
      "plan": "starter",
      "role": "user"
    },
    {
      "email": "pro@test.com", 
      "password": "TestPassword123!",
      "plan": "pro",
      "role": "user"
    },
    {
      "email": "admin@test.com",
      "password": "AdminPassword123!",
      "plan": "business",
      "role": "admin"
    }
  ]
}
```

## Testing Scenarios

### Scenario 1: New User Onboarding
1. Visit landing page
2. Click "Start Free Trial"
3. Complete registration
4. Upload first video
5. Wait for processing
6. Download first clip
7. Share on social media

### Scenario 2: Power User Workflow
1. Login to existing account
2. Upload multiple videos
3. Batch process videos
4. Manage clip library
5. Analyze performance metrics
6. Upgrade subscription plan

### Scenario 3: Error Handling
1. Upload invalid file format
2. Exceed plan limits
3. Network interruption during upload
4. Payment failure
5. Server maintenance mode

## Monitoring During Testing

### Key Metrics to Watch

**Performance Metrics:**
- Response times for all endpoints
- Video processing speed
- Database query performance
- Memory and CPU usage
- Error rates and types

**Business Metrics:**
- User registration conversion
- Video upload success rate
- Clip generation success rate
- Payment processing success
- User engagement metrics

### Testing Tools

**Recommended Testing Tools:**
- **Postman**: API testing and automation
- **Cypress**: End-to-end testing
- **Jest**: Unit testing
- **Artillery**: Load testing
- **Lighthouse**: Performance testing
- **OWASP ZAP**: Security testing

## Quick Test Commands

**Run all tests quickly:**
```bash
# Frontend tests
cd apps/web && npm test

# Backend tests  
cd apps/worker && npm test

# Integration tests
node testing/integration/integration-tests.js

# Health check
node scripts/health-check.js

# Configuration validation
node scripts/validate-config.js
```

## Expected Test Results

**Successful test run should show:**
- ✅ All unit tests passing
- ✅ All integration tests passing
- ✅ Health checks green
- ✅ Configuration valid
- ✅ Performance within targets
- ✅ Security tests passing
- ✅ User flows completing successfully

This comprehensive testing approach ensures ReelRemix works correctly at all levels before deployment and continues to function properly in production.
