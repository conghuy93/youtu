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

### Kiểm tra updates có sẵn
```bash
cd ~/youtube_music_api

# Check local vs remote status
git status
git fetch origin
git log HEAD..origin/master --oneline
# Nếu có commits mới, sẽ hiển thị danh sách changes
```

### Method 1: Auto update từ GitHub
```bash
# Về thư mục server
cd ~/youtube_music_api

# Pull latest changes
git pull origin master

# Check xem có dependency mới không
if [ -f package.json ]; then
    echo "Checking for new dependencies..."
    npm install
fi

# Restart PM2 service
pm2 restart music-server

# Verify server is running
pm2 status
```

### Method 2: Update từ chat này (live updates)

#### 2.1 Xem thay đổi từ chat
Khi có update từ chat, copy code changes vào Pi:

```bash
# Backup current file trước khi edit
cd ~/youtube_music_api
cp server.js server.js.backup

# Edit file với nano
nano server.js
# Paste code changes từ chat, save với Ctrl+X, Y, Enter
```

#### 2.2 Test changes trước khi restart
```bash
# Syntax check
node -c server.js
# Should return nothing if syntax OK

# Test import packages
node -e "require('./server.js')" 2>/dev/null || echo "Import test failed"
```

#### 2.3 Apply changes
```bash
# Stop server
pm2 stop music-server

# Start với test mode để xem live logs
node server.js
# Check logs xem có error không, Ctrl+C để stop

# Nếu OK, start lại với PM2
pm2 start server.js --name music-server

# Monitor logs
pm2 logs music-server --lines 20
```

### Method 3: Hot reload (development mode)
```bash
# Install nodemon cho auto-restart
sudo npm install -g nodemon

# Start với nodemon instead of PM2
pm2 stop music-server  # stop PM2 first
nodemon server.js

# File sẽ auto-restart khi có changes
# Useful khi đang test nhiều changes liên tiếp
```

### Verify update thành công
```bash
# Health check
curl http://localhost:6680/health

# Test new features (example: lyrics LRCLIB)
curl "http://localhost:6680/api/lyric?song=see+you+again&artist=wiz+khalifa&format=lrc" | head -n 5

# Check from ESP32 (replace IP)
curl "http://192.168.0.150:6680/health"
```

### Rollback nếu có vấn đề
```bash
# Method 1: Git rollback
git log --oneline  # Find commit hash to rollback to
git reset --hard COMMIT_HASH
pm2 restart music-server

# Method 2: Restore backup
cp server.js.backup server.js
pm2 restart music-server

# Method 3: Factory reset
git reset --hard origin/master
npm install
pm2 restart music-server
```

### Update dependencies (nếu package.json thay đổi)
```bash
# Clear npm cache
npm cache clean --force

# Reinstall all packages
rm -rf node_modules package-lock.json
npm install

# If errors, try with legacy peer deps
npm install --legacy-peer-deps

# Restart service
pm2 restart music-server
```

### Auto-update script (advanced)
Tạo script tự động check và update:

```bash
# Create update script
nano ~/update_music_server.sh
```

Paste nội dung này:
```bash
#!/bin/bash
cd ~/youtube_music_api

echo "🔍 Checking for updates..."
git fetch origin

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/master)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "📥 Updates available! Updating..."
    
    # Backup current version
    cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)
    
    # Pull changes
    git pull origin master
    
    # Update dependencies if needed
    npm install
    
    # Test syntax
    if node -c server.js; then
        echo "✅ Syntax OK, restarting server..."
        pm2 restart music-server
        sleep 3
        
        # Verify health
        if curl -f http://localhost:6680/health > /dev/null 2>&1; then
            echo "✅ Server updated successfully!"
        else
            echo "❌ Health check failed, rolling back..."
            cp server.js.backup.* server.js
            pm2 restart music-server
        fi
    else
        echo "❌ Syntax error, rolling back..."
        cp server.js.backup.* server.js
    fi
else
    echo "✅ Already up to date!"
fi
```

```bash
# Make executable
chmod +x ~/update_music_server.sh

# Run update
~/update_music_server.sh

# Schedule auto-updates (optional)
crontab -e
# Add line: 0 */6 * * * /home/pi/update_music_server.sh
# Runs every 6 hours
```

### Live debugging khi có issues
```bash
# Real-time logs
pm2 logs music-server --lines 100 -f  # Follow mode

# Check process status
pm2 monit  # Interactive monitor

# Memory/CPU usage
htop
# Press 'F4' để filter 'node'

# Network connections
sudo netstat -tulpn | grep 6680

# Disk space
df -h

# Check for errors in system logs
sudo journalctl -f | grep -i error
```

### Manual patch từ chat
Khi được hướng dẫn paste code specific từ chat:

```bash
# 1. Navigate to location
cd ~/youtube_music_api

# 2. Edit với nano
nano server.js

# 3. Find location (Ctrl+W để search)
# Search cho function name hoặc line number từ instruction

# 4. Copy paste exactly từ chat
# Use mouse right-click paste or Ctrl+Shift+V

# 5. Save & test
# Ctrl+X → Y → Enter để save
node -c server.js  # syntax check

# 6. Restart
pm2 restart music-server
```

### Emergency recovery
```bash
# Complete reset to working state
cd ~/youtube_music_api
git reset --hard origin/master
git clean -fd  # Remove any untracked files
npm install
pm2 restart music-server

# If git is corrupted
rm -rf ~/.youtube_music_api
cd ~
git clone https://github.com/conghuy93/youtu.git youtube_music_api
cd youtube_music_api
npm install
pm2 delete music-server  # Remove old config
pm2 start server.js --name music-server
```

**💡 Best Practice**: Luôn test code changes trước, backup files quan trọng, và verify health check sau mỗi update.

---

## Chat-based Development Workflow  

### Workflow khi nhận code changes từ chat

#### 1. Backup current state
```bash
cd ~/youtube_music_api
cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)
ls -la server.js.backup.*  # Verify backup created
```

#### 2. Apply changes từ chat
```bash
# Method A: Edit trực tiếp với nano
nano server.js

# Trong nano:
# - Ctrl+W: Search cho function/line cần edit
# - Navigate đến vị trí cần thay đổi
# - Delete old code, paste new code từ chat
# - Ctrl+X, Y, Enter để save

# Method B: Use sed cho specific line replacements
# (khi chat cung cấp specific sed commands)
```

#### 3. Validate changes
```bash
# Check syntax
node -c server.js
echo $?  # Should be 0 if OK

# Test imports
node -e "console.log('✅ Syntax OK')" 2>/dev/null && echo "Ready to restart"
```

#### 4. Restart với monitoring
```bash
# Stop current server
pm2 stop music-server

# Test run để xem live errors
timeout 10 node server.js || echo "Test completed"

# If looks good, restart PM2
pm2 start server.js --name music-server

# Monitor first 30 seconds
timeout 30 pm2 logs music-server --lines 0 -f
```

#### 5. Verify functionality  
```bash
# Health check
echo "Testing health check..."
curl -s http://localhost:6680/health | jq .

# Test specific new feature (example for LRCLIB)
echo "Testing new lyrics feature..."
curl -s "http://localhost:6680/api/lyric?song=test&format=lrc" | head -n 3

# Test from network (replace IP)
curl -s http://192.168.0.150:6680/health | jq .
```

### Common chat update scenarios

#### Scenario 1: Function replacement
Khi chat nói: "Replace function `funcName()` with this code:"

```bash
cd ~/youtube_music_api
cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)

nano server.js
# Ctrl+W search "function funcName" hoặc "funcName ="
# Delete entire function, paste new code
# Save: Ctrl+X, Y, Enter

node -c server.js && pm2 restart music-server
```

#### Scenario 2: Add new endpoint
Khi chat nói: "Add this new endpoint after line X:"

```bash
nano server.js
# Navigate to line X (Ctrl+_ then enter line number)
# Or search for nearby function: Ctrl+W
# Insert new code
# Save

node -c server.js && pm2 restart music-server
```

#### Scenario 3: Package.json updates
Khi chat cung cấp new dependencies:

```bash
nano package.json
# Add new packages to dependencies section
# Save

npm install
pm2 restart music-server
```

#### Scenario 4: Multiple file changes
```bash
# Chat cung cấp changes cho nhiều files
cd ~/youtube_music_api

# Backup all
for file in server.js package.json; do
    [ -f "$file" ] && cp "$file" "$file.backup.$(date +%Y%m%d_%H%M%S)"
done

# Apply changes theo thứ tự chat cung cấp
# Test each file syntax if possible
node -c server.js  # for JS files

# Install new deps if package.json changed
[ -f package.json.backup.* ] && npm install

pm2 restart music-server
```

### Quick recovery commands

```bash
# Rollback to last backup
cd ~/youtube_music_api
LAST_BACKUP=$(ls -t server.js.backup.* | head -n1)
cp "$LAST_BACKUP" server.js
pm2 restart music-server

# Quick syntax fix
nano server.js  # Fix the obvious syntax error
pm2 restart music-server

# Nuclear option: reset to GitHub
git checkout -- .
git pull origin master
npm install
pm2 restart music-server
```

### Real-time debugging với chat support

```bash
# Get current server status for chat analysis
echo "=== Server Status ==="
pm2 status

echo "=== Recent Logs ==="
pm2 logs music-server --lines 20

echo "=== Health Check ==="
curl -w "@{http_code}\n" http://localhost:6680/health

echo "=== Process Info ==="
ps aux | grep node

echo "=== Memory Usage ==="
free -h

echo "=== Disk Space ==="
df -h

echo "=== Network ==="
sudo netstat -tulpn | grep 6680
```

**Copy output này vào chat để được support debug!**

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

✅ **Server sẵn sàng!** ESP32 chỉ cần đổi server URL từ `/api/minizjp.com` → `http://PI_IP:6680` để sử dụng lyrics chất lượng cao và streaming ổn định.

**Quick Commands cho ESP32:**
```cpp
// Trong xingzhi-cube-1.54tft-wifi.cc
normalize_server_url("http://192.168.0.150:6680");  // Thay IP thực tế
```
