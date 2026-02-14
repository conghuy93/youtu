#!/bin/bash
# ============================================
# YouTube MP3 API - Server Setup Script
# Dành cho Ubuntu/Debian Linux Server
# ============================================

set -e

echo "=========================================="
echo "  YouTube MP3 API - Server Setup"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Config
APP_DIR="/root/youtube_mp3_api"
APP_NAME="youtube-mp3-api"
PORT=6680

# 1. Update system
echo -e "${YELLOW}[1/8] Updating system...${NC}"
apt-get update -y
apt-get upgrade -y

# 2. Install dependencies
echo -e "${YELLOW}[2/8] Installing dependencies...${NC}"
apt-get install -y curl wget git ffmpeg python3 python3-pip

# 3. Install Node.js 20.x
echo -e "${YELLOW}[3/8] Installing Node.js 20.x...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
node --version
npm --version

# 4. Install PM2
echo -e "${YELLOW}[4/8] Installing PM2...${NC}"
npm install -g pm2

# 5. Install yt-dlp
echo -e "${YELLOW}[5/8] Installing yt-dlp...${NC}"
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
chmod +x /usr/local/bin/yt-dlp
yt-dlp --version

# 6. Setup application
echo -e "${YELLOW}[6/8] Setting up application...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

# Copy files or clone (uncomment if using git)
# git clone https://github.com/your-repo/youtube_mp3_api.git .

# If files already exist, just install dependencies
if [ -f "package.json" ]; then
    rm -rf node_modules package-lock.json
    npm cache clean --force
    npm install
fi

# 7. Create ecosystem config
echo -e "${YELLOW}[7/8] Creating PM2 ecosystem config...${NC}"
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'youtube-mp3-api',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 6680,
      YTDLP_PATH: '/usr/local/bin/yt-dlp',
      FFMPEG_PATH: '/usr/bin/ffmpeg'
    },
    error_file: '/var/log/youtube-mp3-api-error.log',
    out_file: '/var/log/youtube-mp3-api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

# 8. Start with PM2
echo -e "${YELLOW}[8/8] Starting application with PM2...${NC}"
pm2 delete $APP_NAME 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Open firewall
echo -e "${YELLOW}Opening firewall port $PORT...${NC}"
ufw allow $PORT/tcp 2>/dev/null || iptables -A INPUT -p tcp --dport $PORT -j ACCEPT || true

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s api.ipify.org || echo "YOUR_SERVER_IP")
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}=========================================="
echo "  ✅ Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "📍 Access URLs:"
echo "   Local:    http://localhost:$PORT"
echo "   LAN:      http://$LOCAL_IP:$PORT"
echo "   Public:   http://$SERVER_IP:$PORT"
echo ""
echo "🔧 PM2 Commands:"
echo "   pm2 logs $APP_NAME        # View logs"
echo "   pm2 restart $APP_NAME     # Restart"
echo "   pm2 stop $APP_NAME        # Stop"
echo "   pm2 monit                 # Monitor"
echo ""
echo "🧪 Test API:"
echo "   curl http://localhost:$PORT/health"
echo "   curl \"http://localhost:$PORT/stream_pcm?song=Lac+Troi\""
echo ""
