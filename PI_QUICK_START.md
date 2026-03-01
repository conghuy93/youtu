# Quick Start - Raspberry Pi

Hướng dẫn nhanh để chạy YouTube Music API trên Raspberry Pi.

## 1. Cài đặt dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install FFmpeg (required for audio conversion)
sudo apt install -y ffmpeg

# Install yt-dlp (required for YouTube download)
sudo wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# Verify installations
node --version
npm --version
ffmpeg -version
yt-dlp --version
```

## 2. Clone repository

```bash
cd ~
git clone https://github.com/conghuy93/youtu.git youtube_music_api
cd youtube_music_api
```

## 3. Install npm packages

```bash
npm install
```

## 4. Run server

### Option A: Test run (foreground)
```bash
node server.js
```

### Option B: Production run with PM2 (recommended)
```bash
# Install PM2
sudo npm install -g pm2

# Start server
pm2 start server.js --name music-server

# Enable auto-start on boot
pm2 startup
pm2 save

# Monitor
pm2 status
pm2 logs music-server
```

## 5. Test server

```bash
# Get Pi's IP address
hostname -I

# Test from Pi
curl http://localhost:6680/health

# Test from another device
curl http://[PI_IP]:6680/health
```

## 6. Configure ESP32

Update server URL in ESP32 code to Pi's IP:
```cpp
normalize_server_url("http://192.168.0.150:6680");  // Replace with your Pi IP
```

## Server endpoints

- `GET /health` - Server health check
- `GET /api/stream/mp3?url=YOUTUBE_URL` - Stream MP3 audio
- `GET /api/lyric?id=VIDEO_ID&format=lrc` - Get lyrics in LRC format
- `GET /stream_pcm?song=SONG_NAME&artist=ARTIST` - Compatible with ESP32

## Troubleshooting

### Port already in use
```bash
# Find process using port 6680
sudo netstat -tulpn | grep 6680

# Kill the process
sudo kill -9 [PID]
```

### Check logs
```bash
pm2 logs music-server --lines 100
```

### Restart server
```bash
pm2 restart music-server
```

### Update yt-dlp
```bash
sudo yt-dlp -U
```

### Memory issues on low-RAM Pi
```bash
# Limit Node.js memory
export NODE_OPTIONS="--max-old-space-size=512"
pm2 start server.js --name music-server --max-memory-restart 300M
```

## Performance tips

- Use Pi 4/5 for better performance
- Enable swap if RAM < 2GB
- Use wired Ethernet for stable streaming
- Keep yt-dlp updated for best compatibility

## See also

- `RASPBERRY_PI5_GUIDE.md` - Detailed Pi 5 setup guide
- `API_REFERENCE.md` - Complete API documentation
- `TROUBLESHOOTING.md` - Common issues and solutions
