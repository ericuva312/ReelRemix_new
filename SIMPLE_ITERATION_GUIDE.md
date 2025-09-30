# 🔄 **ReelRemix Simple Iteration Workflow**

## **🎯 GOAL: Make Changes and See Them Live in 30 Seconds**

This setup ensures you can iterate quickly without complex deployment processes.

---

## **SETUP 1: GitHub Auto-Deployment (Recommended)**

### **Frontend (Vercel) - Auto-Deploy on Git Push**

**One-Time Setup:**
1. Connect Vercel to your GitHub repository
2. Set auto-deploy branch to `main` or `branch-6`
3. Enable automatic deployments

**Daily Workflow:**
```bash
# Make changes to frontend
cd /home/ubuntu/reelremix/apps/web/src
# Edit any file (pages, components, etc.)

# Push changes
git add .
git commit -m "Update feature X"
git push origin branch-6

# ✅ Vercel automatically deploys in 30-60 seconds
# ✅ Live URL updates automatically
```

### **Backend (Railway) - Auto-Deploy on Git Push**

**One-Time Setup:**
1. Connect Railway to your GitHub repository
2. Set deploy path to `/apps/worker`
3. Enable automatic deployments

**Daily Workflow:**
```bash
# Make changes to backend
cd /home/ubuntu/reelremix/apps/worker/src
# Edit automated-server.cjs or any other file

# Push changes
git add .
git commit -m "Update API endpoint"
git push origin branch-6

# ✅ Railway automatically deploys in 60-90 seconds
# ✅ API updates automatically
```

---

## **SETUP 2: Local Development with Live Reload**

### **Frontend Development Server**
```bash
# Terminal 1: Start frontend dev server
cd /home/ubuntu/reelremix/apps/web
npm run dev

# ✅ Opens on http://localhost:3000
# ✅ Auto-reloads on file changes
# ✅ Hot module replacement
```

### **Backend Development Server**
```bash
# Terminal 2: Start backend dev server
cd /home/ubuntu/reelremix/apps/worker
npm install -g nodemon
nodemon src/automated-server.cjs

# ✅ Runs on http://localhost:3001
# ✅ Auto-restarts on file changes
```

### **Development Workflow**
1. Make changes to any file
2. Save the file
3. Browser automatically refreshes (frontend)
4. Server automatically restarts (backend)
5. Test changes instantly

---

## **SETUP 3: One-Command Deployment Scripts**

### **Create Deployment Scripts**

```bash
# Frontend deployment script
cat > /home/ubuntu/reelremix/deploy-frontend.sh << 'EOF'
#!/bin/bash
echo "🚀 Deploying Frontend..."
cd /home/ubuntu/reelremix/apps/web
git add .
git commit -m "Frontend update $(date)"
git push origin branch-6
echo "✅ Frontend deployed! Check Vercel dashboard for status."
EOF

# Backend deployment script
cat > /home/ubuntu/reelremix/deploy-backend.sh << 'EOF'
#!/bin/bash
echo "🚀 Deploying Backend..."
cd /home/ubuntu/reelremix/apps/worker
git add .
git commit -m "Backend update $(date)"
git push origin branch-6
echo "✅ Backend deployed! Check Railway dashboard for status."
EOF

# Make scripts executable
chmod +x /home/ubuntu/reelremix/deploy-frontend.sh
chmod +x /home/ubuntu/reelremix/deploy-backend.sh
```

### **Usage**
```bash
# Deploy frontend changes
./deploy-frontend.sh

# Deploy backend changes
./deploy-backend.sh

# Deploy both
./deploy-frontend.sh && ./deploy-backend.sh
```

---

## **SETUP 4: Environment Configuration**

### **Frontend Environment Variables**

Create `/home/ubuntu/reelremix/apps/web/.env.local`:
```bash
# Development
VITE_API_URL=http://localhost:3001

# Production (set in Vercel dashboard)
# VITE_API_URL=https://your-railway-url.up.railway.app
```

### **Backend Environment Variables**

Create `/home/ubuntu/reelremix/apps/worker/.env`:
```bash
# Development
NODE_ENV=development
PORT=3001
JWT_SECRET=dev-secret-key

# Production (set in Railway dashboard)
# NODE_ENV=production
# PORT=3000
# JWT_SECRET=production-secret-key
```

---

## **SETUP 5: Quick Testing Commands**

### **Create Test Scripts**

```bash
# Frontend test script
cat > /home/ubuntu/reelremix/test-frontend.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing Frontend..."
cd /home/ubuntu/reelremix/apps/web
npm run build
echo "✅ Frontend build successful!"
EOF

# Backend test script
cat > /home/ubuntu/reelremix/test-backend.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing Backend..."
cd /home/ubuntu/reelremix/apps/worker
node src/automated-server.cjs &
SERVER_PID=$!
sleep 3
curl -s http://localhost:3001/health | grep -q "healthy" && echo "✅ Backend health check passed!" || echo "❌ Backend health check failed!"
kill $SERVER_PID
EOF

# Make scripts executable
chmod +x /home/ubuntu/reelremix/test-frontend.sh
chmod +x /home/ubuntu/reelremix/test-backend.sh
```

---

## **DAILY ITERATION WORKFLOW**

### **Making Frontend Changes**
```bash
# 1. Start dev server (if not running)
cd /home/ubuntu/reelremix/apps/web
npm run dev

# 2. Edit files in src/ directory
# - pages/ for page components
# - components/ for reusable components
# - services/ for API calls

# 3. See changes instantly in browser

# 4. When ready, deploy
./deploy-frontend.sh
```

### **Making Backend Changes**
```bash
# 1. Start dev server (if not running)
cd /home/ubuntu/reelremix/apps/worker
nodemon src/automated-server.cjs

# 2. Edit automated-server.cjs or other files

# 3. Server restarts automatically

# 4. Test with curl or frontend

# 5. When ready, deploy
./deploy-backend.sh
```

### **Common Changes You'll Make**

**Frontend:**
- Update UI components in `src/components/`
- Modify pages in `src/pages/`
- Adjust API calls in `src/services/api-automated.js`
- Change styling with Tailwind classes

**Backend:**
- Add new API endpoints in `automated-server.cjs`
- Modify processing logic
- Update authentication rules
- Change response formats

---

## **SETUP 6: File Structure for Easy Navigation**

```
reelremix/
├── apps/
│   ├── web/                    # Frontend (React)
│   │   ├── src/
│   │   │   ├── pages/          # Main pages
│   │   │   ├── components/     # Reusable components
│   │   │   └── services/       # API calls
│   │   └── package.json
│   └── worker/                 # Backend (Node.js)
│       ├── src/
│       │   └── automated-server.cjs  # Main server file
│       └── package.json
├── deploy-frontend.sh          # One-click frontend deploy
├── deploy-backend.sh           # One-click backend deploy
├── test-frontend.sh            # Frontend testing
└── test-backend.sh             # Backend testing
```

---

## **SETUP 7: VS Code Integration (Optional)**

### **Recommended Extensions**
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Auto Rename Tag
- Prettier - Code formatter
- GitLens

### **VS Code Settings**
Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

---

## **🚀 RESULT: SUPER FAST ITERATION**

With this setup:

**Development**: Make changes → See results in 1-2 seconds
**Testing**: Run tests → Get results in 5-10 seconds  
**Deployment**: Push changes → Live in 30-90 seconds
**Rollback**: Git revert → Back to previous version in 30 seconds

**No complex build processes, no waiting, no friction!**

---

## **QUICK START COMMANDS**

```bash
# Start development (run in separate terminals)
cd /home/ubuntu/reelremix/apps/web && npm run dev
cd /home/ubuntu/reelremix/apps/worker && nodemon src/automated-server.cjs

# Deploy changes
./deploy-frontend.sh
./deploy-backend.sh

# Test everything
./test-frontend.sh && ./test-backend.sh
```

**You can now iterate at lightning speed! 🔥**
