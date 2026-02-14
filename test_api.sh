#!/bin/bash
# Script test API sau khi server đã start

echo "=== Testing YouTube MP3 API ==="
echo ""

BASE_URL="http://localhost:6666"

# Test 1: Health check
echo "1. Testing health check..."
if curl -s "${BASE_URL}/health" > /dev/null; then
    echo "   ✅ Health check OK"
    curl -s "${BASE_URL}/health" | head -5
else
    echo "   ❌ Health check failed"
fi
echo ""

# Test 2: Get video info
echo "2. Testing get video info..."
VIDEO_ID="dQw4w9WgXcQ" # Rick Roll
if curl -s "${BASE_URL}/api/info?id=${VIDEO_ID}" > /dev/null; then
    echo "   ✅ Get info OK"
    curl -s "${BASE_URL}/api/info?id=${VIDEO_ID}" | head -10
else
    echo "   ❌ Get info failed"
fi
echo ""

# Test 3: Search
echo "3. Testing search..."
if curl -s "${BASE_URL}/api/search?q=music&limit=3" > /dev/null; then
    echo "   ✅ Search OK"
    curl -s "${BASE_URL}/api/search?q=music&limit=3" | head -10
else
    echo "   ❌ Search failed"
fi
echo ""

# Test 4: Stats
echo "4. Testing stats..."
if curl -s "${BASE_URL}/stats" > /dev/null; then
    echo "   ✅ Stats OK"
    curl -s "${BASE_URL}/stats" | head -10
else
    echo "   ❌ Stats failed"
fi
echo ""

echo "=== Test completed ==="
echo ""
echo "If all tests pass, your API is working!"
echo "Access from network: http://192.168.1.5:6666/health"







