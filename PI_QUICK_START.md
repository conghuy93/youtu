# Quick Start - Raspberry Pi

Hướng dẫn chi tiết từng bước để chạy YouTube Music API trên Raspberry Pi với lyrics chất lượng cao.

## Tính năng mới
- **LRCLIB.net Integration**: Lyrics chính xác do con người phiên âm, thay vì YouTube auto-captions
- **Smart Title Parsing**: Tự động extract tên bài hát/ca sĩ từ YouTube titles
- **Fallback Pipeline**: LRCLIB → YouTube subtitles → No lyrics

## 1. Chuẩn bị Pi

### SSH vào Pi (recommended)
```bash
# Từ máy Windows/Mac, SSH vào Pi
ssh pi@192.168.0.XXX  # Thay XXX bằng IP của Pi

# Hoặc dùng default password nếu chưa đổi
# Username: pi, Password: raspberry
```

### Enable SSH nếu chưa bật
```bash
# Nếu không SSH được, cắm keyboard/monitor vào Pi
sudo systemctl enable ssh
sudo systemctl start ssh

# Đổi password mặc định để bảo mật
sudo passwd pi
```

## 2. Update hệ thống

```bash
# Update package list và upgrade
sudo apt update && sudo apt upgrade -y

# Reboot nếu kernel được update
sudo reboot  # (optional, nếu có kernel update)
```

## 3. Cài đặt Node.js 18+

### Kiểm tra version hiện tại
```bash
node --version
# Nếu < 18.x, cần cài đặt mới
```

### Cài Node.js 18.x (LTS, recommended)
```bash
# Download NodeSource repository key
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js 18.x
sudo apt install -y nodejs

# Verify installation
node --version   # Should show v18.x.x
npm --version    # Should show 9.x.x+
```

### Alternative: Node.js 20.x (newest)
```bash
# Nếu muốn version mới nhất
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 4. Cài đặt FFmpeg (required)

```bash
# Cài FFmpeg từ repository
sudo apt install -y ffmpeg

# Verify installation
ffmpeg -version
# Should show version info and supported codecs
```

## 5. Cài đặt yt-dlp (required cho lyrics)

### Method 1: Download binary (recommended)
```bash
# Download latest yt-dlp binary
sudo wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp

# Make executable
sudo chmod a+rx /usr/local/bin/yt-dlp

# Verify installation
yt-dlp --version
```

### Method 2: Via pip (alternative)
```bash
# Nếu method 1 không hoạt động
sudo apt install -y python3-pip
sudo pip3 install yt-dlp

# Verify
yt-dlp --version
```

## 6. Download server code

### Option A: Clone từ GitHub
```bash
# Về home directory
cd ~

# Clone repository
git clone https://github.com/conghuy93/youtu.git youtube_music_api

# Enter directory
cd youtube_music_api

# Check files
ls -la
# Should see: server.js, package.json, PI_QUICK_START.md, etc.
```

### Option B: Download ZIP (nếu không có git)
```bash
# Download và giải nén
wget https://github.com/conghuy93/youtu/archive/refs/heads/master.zip
unzip master.zip
mv youtu-master youtube_music_api
cd youtube_music_api
```

## 7. Cài dependencies

```bash
# Make sure đang ở folder youtube_music_api
pwd  # Should show /home/pi/youtube_music_api

# Remove old node_modules nếu có (từ Windows)
rm -rf node_modules package-lock.json

# Install npm packages
npm install

# Quá trình này sẽ mất 2-5 phút tùy Pi model
# Pi 5: ~2 phút, Pi 4: ~3 phút, Pi 3: ~5 phút
```

## 8. Test installation

```bash
# Test imports
node -e "
try {
  require('express');
  require('cors');
  require('axios');
  require('@distube/ytdl-core');
  require('youtube-sr');
  require('fluent-ffmpeg');
  console.log('✅ All packages installed successfully');
} catch(e) {
  console.error('❌ Missing package:', e.message);
  process.exit(1);
}
"
```

## 9. Chạy server

### Method A: Test run (foreground)
```bash
# Start server
node server.js

# You should see:
# [YouTube API] Starting server on port 6680...
# ✓ express loaded
# ✓ cors loaded  
# ✓ axios loaded
# ✓ ytdl loaded
# ✓ youtube-sr loaded
# ✓ fluent-ffmpeg loaded
# [YouTube API] Server ready at http://localhost:6680
```

### Test từ terminal khác
```bash
# Mở terminal mới (SSH session thứ 2)
curl http://localhost:6680/health
# Should return: {"status":"ok","service":"YouTube MP3/MP4 API","uptime":XX}

# Test lyrics với LRCLIB
curl "http://localhost:6680/api/lyric?song=see+you+again&artist=wiz+khalifa&format=lrc" | head -n 5
# Should return synced LRC lyrics from LRCLIB
```

### Method B: Production run với PM2 (recommended)

```bash
# Stop test server first (Ctrl+C if running)

# Install PM2 globally
sudo npm install -g pm2

# Start server với PM2
pm2 start server.js --name music-server

# Check status
pm2 status
# Should show music-server running

# View logs
pm2 logs music-server --lines 20

# Enable auto-start khi Pi boot
pm2 startup
# Follow the instructions (run the sudo command shown)

pm2 save
# Saves current PM2 process list
```

## 10. Network configuration

### Lấy IP của Pi
```bash
# Get IP address
hostname -I
# Example output: 192.168.0.150

# Hoặc
ip addr show wlan0 | grep inet
```

### Test từ máy khác trong mạng
```bash
# Từ Windows/Mac/phone, test:
curl http://192.168.0.150:6680/health
# Replace 192.168.0.150 với IP thực tế của Pi
```

### Mở firewall nếu cần
```bash
# Pi sẽ accept connections trên port 6680 by default
# Nếu không connect được, thử:
sudo ufw allow 6680/tcp
sudo ufw enable
```

## 11. Cấu hình ESP32

Update ESP32 code để trỏ đến Pi:

```cpp
// Trong file xingzhi-cube-1.54tft-wifi.cc
normalize_server_url("http://192.168.0.150:6680");  // Thay IP của Pi
```

Build và flash lại ESP32:
```bash
# Trên máy dev ESP32
idf.py build
idf.py -p COM39 flash
```

## 12. Test endpoints

```bash
# Health check
curl "http://localhost:6680/health"

# Stream mp3 (audio only)  
curl "http://localhost:6680/api/stream/mp3?url=https://www.youtube.com/watch?v=RgKAFK5djSk" -I
# Should return HTTP 200 and audio stream headers

# Lyrics từ LRCLIB (chất lượng cao)
curl "http://localhost:6680/api/lyric?song=see+you+again&artist=wiz+khalifa&format=lrc" | head -n 10

# ESP32 compatible endpoint
curl "http://localhost:6680/stream_pcm?song=bac+phan&artist=jack"
# Returns JSON với audio_url và lyric_url
```

## 13. Monitor & logs

```bash
# PM2 commands
pm2 status              # Process status
pm2 logs music-server   # Live logs
pm2 restart music-server # Restart
pm2 stop music-server   # Stop
pm2 delete music-server # Remove from PM2

# System monitoring
htop                    # CPU/RAM usage
df -h                   # Disk space
free -h                 # Memory usage

# Check network connections
sudo netstat -tulpn | grep 6680
```

## Troubleshooting

### Port already in use
```bash
# Find process using port 6680
sudo netstat -tulpn | grep 6680
# Output: tcp6  :::6680  :::*  LISTEN  1234/node

# Kill the process
sudo kill -9 1234  # Replace 1234 với PID thực tế

# Or kill all node processes
sudo pkill -9 node
```

### yt-dlp errors
```bash
# Update yt-dlp
sudo yt-dlp -U

# Test manually 
yt-dlp --get-title "https://www.youtube.com/watch?v=RgKAFK5djSk"
```

### Memory issues (Pi 3 hoặc Pi Zero)
```bash
# Increase swap
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Change CONF_SWAPSIZE=1024
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# Limit Node.js memory
export NODE_OPTIONS="--max-old-space-size=512"
pm2 start server.js --name music-server --max-memory-restart 300M
```

### Network connectivity issues
```bash
# Check Pi can reach internet
ping -c 3 8.8.8.8

# Check DNS resolution
nslookup youtube.com

# Check firewall
sudo ufw status

# Restart networking
sudo systemctl restart networking
```

### Song không tìm thấy lyrics
Server sẽ thử theo thứ tự:
1. **LRCLIB.net** - Human-transcribed synced lyrics (chính xác)
2. **YouTube auto-subtitles** - Machine transcription (có thể sai)
3. **No lyrics** - Chỉ phát nhạc, không có lyrics

Check logs để thấy nguồn nào được sử dụng:
```bash
pm2 logs music-server | grep "LRCLIB\|Lyrics"
```

## Update server

```bash
# Cập nhật code mới từ GitHub
cd ~/youtube_music_api
git pull origin master

# Restart PM2 service
pm2 restart music-server

# Or restart manually
npm install  # if new packages added
pm2 restart music-server
```

## Performance tips

- **Pi 5**: Tốt nhất, handle 5-10 concurrent streams
- **Pi 4**: Tốt, handle 3-5 concurrent streams  
- **Pi 3**: OK cho 1-2 streams
- **Pi Zero**: Chậm, chỉ nên dùng 1 stream

### Optimization cho Pi cấu hình thấp
```bash
# Use lightweight alternatives
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=256"

# PM2 với memory limit
pm2 start server.js --name music-server --max-memory-restart 200M
```

## Server endpoints chi tiết

| Endpoint | Mô tả | Example |
|----------|--------|---------|
| `/health` | Health check | `curl http://pi-ip:6680/health` |
| `/api/lyric?id=VIDEO_ID&format=lrc` | Get lyrics by YouTube ID | Video-specific lyrics |
| `/api/lyric?song=TITLE&artist=ARTIST&format=lrc` | Search lyrics | Generic song search |  
| `/api/stream/mp3?id=VIDEO_ID` | Stream MP3 audio | Direct video streaming |
| `/stream_pcm?song=TITLE&artist=ARTIST` | ESP32 compatible | Returns JSON with URLs |

**LRCLIB Integration**: Server tự động thử lyrics chất lượng cao trước, fallback sang YouTube subtitles nếu không tìm thấy.

---

✅ **Server sẵn sàng!** ESP32 /api/minizjp.com → http://PI_IP:6680 để sử dụng lyrics chất lượng cao.

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
