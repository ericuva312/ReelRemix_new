#!/bin/bash
echo "🚀 Deploying Frontend..."
cd /home/ubuntu/reelremix/apps/web
git add .
git commit -m "Frontend update $(date)"
git push origin branch-6
echo "✅ Frontend deployed! Check Vercel dashboard for status."
echo "🌐 Your changes will be live in 30-60 seconds"
