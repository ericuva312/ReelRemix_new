#!/bin/bash
echo "🧪 Testing Backend..."
cd /home/ubuntu/reelremix/apps/worker

# Use a different port for testing
export PORT=3333

# Start server in background
node src/automated-server.cjs &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test health endpoint
if curl -s http://localhost:3333/health | grep -q "healthy"; then
    echo "✅ Backend health check passed!"
    RESULT=0
else
    echo "❌ Backend health check failed!"
    RESULT=1
fi

# Kill server
kill $SERVER_PID 2>/dev/null

exit $RESULT
