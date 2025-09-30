# 🚀 **ReelRemix Quick Start Guide**

## **Start Development in 30 Seconds**

### **Terminal 1: Frontend Development Server**
```bash
cd /home/ubuntu/reelremix/apps/web
npm run dev
```
✅ Opens at `http://localhost:3000` with hot reload

### **Terminal 2: Backend Development Server**
```bash
cd /home/ubuntu/reelremix/apps/worker
npm install -g nodemon
nodemon src/automated-server.cjs
```
✅ API runs at `http://localhost:3001` with auto-restart

---

## **Make Changes Instantly**

### **Frontend Changes**
1. Edit any file in `apps/web/src/`
2. Save the file
3. Browser automatically refreshes
4. See changes instantly

### **Backend Changes**
1. Edit `apps/worker/src/automated-server.cjs`
2. Save the file
3. Server automatically restarts
4. Test with frontend or curl

---

## **Deploy Changes in 30 Seconds**

### **Deploy Frontend**
```bash
./deploy-frontend.sh
```
✅ Live in 30-60 seconds on Vercel

### **Deploy Backend**
```bash
./deploy-backend.sh
```
✅ Live in 60-90 seconds on Railway

### **Deploy Both**
```bash
./deploy-frontend.sh && ./deploy-backend.sh
```

---

## **Test Before Deploying**

### **Test Frontend**
```bash
./test-frontend.sh
```

### **Test Backend**
```bash
./test-backend.sh
```

### **Test Both**
```bash
./test-frontend.sh && ./test-backend.sh
```

---

## **Common File Locations**

### **Frontend Files to Edit**
- `apps/web/src/pages/` - Main pages (HomePage, AuthPage, etc.)
- `apps/web/src/components/` - Reusable components
- `apps/web/src/services/api-automated.js` - API calls

### **Backend Files to Edit**
- `apps/worker/src/automated-server.cjs` - Main server file
- `apps/worker/package.json` - Dependencies

---

## **Environment Variables**

### **Development (Already Set)**
- Frontend: `apps/web/.env.local`
- Backend: `apps/worker/.env`

### **Production (Set in Dashboards)**
- Vercel: `VITE_API_URL=https://your-railway-url.up.railway.app`
- Railway: `NODE_ENV=production`, `PORT=3000`, `JWT_SECRET=...`

---

## **Workflow Summary**

1. **Start dev servers** (once per session)
2. **Make changes** to any file
3. **See changes instantly** in browser
4. **Test locally** with test scripts
5. **Deploy** with one command
6. **Changes live** in under 2 minutes

**No complex build processes, no waiting! 🔥**
