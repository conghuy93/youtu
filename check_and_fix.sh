#!/bin/bash
# Script kiểm tra và fix các vấn đề thường gặp

echo "=== YouTube MP3 API - Check and Fix ==="
echo ""

# 1. Kiểm tra dependencies
echo "1. Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "   ❌ node_modules not found!"
    echo "   Installing dependencies..."
    npm install
else
    echo "   ✅ node_modules exists"
fi

# 2. Kiểm tra PM2
echo ""
echo "2. Checking PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "   ❌ PM2 not installed!"
    echo "   Installing PM2..."
    npm install -g pm2
else
    echo "   ✅ PM2 installed"
fi

# 3. Kiểm tra port
echo ""
echo "3. Checking port 6666..."
if lsof -Pi :6666 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "   ⚠️  Port 6666 is in use"
    echo "   Checking which process..."
    lsof -i :6666
else
    echo "   ✅ Port 6666 is available"
fi

# 4. Kiểm tra logs
echo ""
echo "4. Checking PM2 logs..."
if pm2 list | grep -q "youtube-mp3-api"; then
    echo "   App is running in PM2"
    echo "   Recent logs:"
    pm2 logs youtube-mp3-api --lines 10 --nostream
else
    echo "   App is not running in PM2"
fi

# 5. Test server
echo ""
echo "5. Testing server..."
if curl -s http://localhost:6666/health > /dev/null; then
    echo "   ✅ Server is responding"
    curl -s http://localhost:6666/health | head -3
else
    echo "   ❌ Server is not responding"
    echo "   Try: pm2 restart youtube-mp3-api"
fi

echo ""
echo "=== Check completed ==="
echo ""
echo "If server is not working:"
echo "1. Check logs: pm2 logs youtube-mp3-api"
echo "2. Restart: pm2 restart youtube-mp3-api"
echo "3. Check dependencies: npm install"







