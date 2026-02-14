#!/bin/bash
# Script xem logs và tìm lỗi

echo "=== Checking YouTube MP3 API Logs ==="
echo ""

# Xem error logs
echo "1. Error Logs:"
echo "----------------------------------------"
pm2 logs youtube-mp3-api --err --lines 50 --nostream
echo ""

# Xem output logs
echo "2. Output Logs:"
echo "----------------------------------------"
pm2 logs youtube-mp3-api --out --lines 50 --nostream
echo ""

# Xem file logs trực tiếp
echo "3. Log Files:"
echo "----------------------------------------"
if [ -f "logs/pm2-error.log" ]; then
    echo "Error log (last 50 lines):"
    tail -50 logs/pm2-error.log
    echo ""
fi

if [ -f "logs/pm2-out.log" ]; then
    echo "Output log (last 50 lines):"
    tail -50 logs/pm2-out.log
    echo ""
fi

echo "=== Analysis ==="
echo ""
echo "Common issues:"
echo "- 'Cannot find module' → Run: npm install"
echo "- 'EADDRINUSE' → Port in use, change PORT or kill process"
echo "- 'SyntaxError' → Check server.js for syntax errors"
echo "- 'ytdl-core' errors → Update ytdl-core or check YouTube API changes"







