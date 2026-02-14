#!/bin/bash
# Script test format audio từ YouTube API

VIDEO_ID="${1:-ZpPBozhojuo}"
BASE_URL="http://localhost:6666"

echo "=========================================="
echo "Testing Audio Format for Video: $VIDEO_ID"
echo "=========================================="
echo ""

# Test 1: Check format endpoint
echo "1. Checking format via /api/check-format:"
echo "----------------------------------------"
curl -s "${BASE_URL}/api/check-format?id=${VIDEO_ID}" | python3 -m json.tool 2>/dev/null || curl -s "${BASE_URL}/api/check-format?id=${VIDEO_ID}"
echo ""
echo ""

# Test 2: Check Content-Type header
echo "2. Checking Content-Type header:"
echo "----------------------------------------"
CONTENT_TYPE=$(curl -s -I "${BASE_URL}/api/stream/mp3?id=${VIDEO_ID}" | grep -i "content-type" | cut -d' ' -f2 | tr -d '\r\n')
echo "Content-Type: $CONTENT_TYPE"

if [[ "$CONTENT_TYPE" == *"audio/mp4"* ]]; then
    echo "✅ Format: M4A (AAC) - ĐÚNG!"
elif [[ "$CONTENT_TYPE" == *"audio/webm"* ]]; then
    echo "❌ Format: WebM (Opus) - KHÔNG PHẢI M4A"
else
    echo "⚠️  Format: Unknown ($CONTENT_TYPE)"
fi
echo ""

# Test 3: Check direct URL từ yt-dlp
echo "3. Checking yt-dlp direct URL format:"
echo "----------------------------------------"
# Lấy một phần URL để kiểm tra (không download toàn bộ)
curl -s -I "${BASE_URL}/api/stream/mp3?id=${VIDEO_ID}" -r 0-0 2>&1 | head -20
echo ""

# Test 4: Kiểm tra itag trong URL (nếu có)
echo "4. Checking for M4A itags (140, 141, 139) in response:"
echo "----------------------------------------"
# Lấy info và check format
curl -s "${BASE_URL}/api/info?id=${VIDEO_ID}" | grep -o '"itag":[0-9]*' | head -5
echo ""

echo "=========================================="
echo "Test completed!"
echo "=========================================="





