#!/bin/bash
echo "🧪 Testing Frontend..."
cd /home/ubuntu/reelremix/apps/web
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
else
    echo "❌ Frontend build failed!"
    exit 1
fi
