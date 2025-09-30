#!/bin/bash
echo "🚀 Deploying Backend..."
cd /home/ubuntu/reelremix/apps/worker
git add .
git commit -m "Backend update $(date)"
git push origin branch-6
echo "✅ Backend deployed! Check Railway dashboard for status."
echo "🌐 Your API changes will be live in 60-90 seconds"
