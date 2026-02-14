#!/bin/bash
# Start script với PM2

echo "=== Starting YouTube MP3 API with PM2 ==="

# Kiểm tra PM2 đã cài chưa
if ! command -v pm2 &> /dev/null; then
    echo "PM2 chưa được cài đặt!"
    echo "Đang cài đặt PM2..."
    npm install -g pm2
fi

# Kiểm tra node_modules
if [ ! -d "node_modules" ]; then
    echo "Đang cài đặt dependencies..."
    npm install
fi

# Tạo thư mục logs nếu chưa có
mkdir -p logs

# Start với PM2
echo "Starting server..."
pm2 start ecosystem.config.js

# Hiển thị status
pm2 status

echo ""
echo "✅ Server đã được start!"
echo ""
echo "Các lệnh hữu ích:"
echo "  pm2 logs youtube-mp3-api    - Xem logs"
echo "  pm2 monit                   - Monitor"
echo "  pm2 restart youtube-mp3-api - Restart"
echo "  pm2 stop youtube-mp3-api     - Stop"
echo ""







