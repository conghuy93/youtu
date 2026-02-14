# 🚀 Deploy YouTube MP3 API lên Linux Server

## Yêu cầu
- Ubuntu 20.04+ hoặc Debian 11+
- RAM: 1GB+
- Quyền root

---

## 🔧 Cài đặt nhanh (1 lệnh)

```bash
# Upload files lên server rồi chạy:
chmod +x setup_server.sh
./setup_server.sh
```

---

## 📝 Cài đặt thủ công

### 1. Cài dependencies

```bash
apt-get update -y
apt-get install -y curl wget git ffmpeg python3 python3-pip
```

### 2. Cài Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version
```

### 3. Cài PM2

```bash
npm install -g pm2
```

### 4. Cài yt-dlp

```bash
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
chmod +x /usr/local/bin/yt-dlp
yt-dlp --version
```

### 5. Setup ứng dụng

```bash
cd /root/youtube_mp3_api
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### 6. Khởi động với PM2

```bash
# Set environment
export YTDLP_PATH=/usr/local/bin/yt-dlp
export FFMPEG_PATH=/usr/bin/ffmpeg

# Start
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🔥 Lệnh PM2 thường dùng

```bash
# Xem trạng thái
pm2 ls

# Xem logs
pm2 logs youtube-mp3-api
pm2 logs youtube-mp3-api --lines 50

# Restart
pm2 restart youtube-mp3-api

# Stop
pm2 stop youtube-mp3-api

# Delete và start lại
pm2 delete youtube-mp3-api
pm2 start ecosystem.config.js

# Monitor real-time
pm2 monit

# Lưu config để auto-start khi reboot
pm2 save
pm2 startup
```

---

## 🧪 Test API

```bash
# Health check
curl http://localhost:6680/health

# Search
curl "http://localhost:6680/api/search?q=Lac+Troi"

# Stream (cho ESP32)
curl "http://localhost:6680/stream_pcm?song=Lac+Troi&artist=Son+Tung"

# Stream MP3
curl "http://localhost:6680/api/stream/mp3?id=VIDEO_ID&format=proxy"
```

---

## 🔓 Mở Firewall

```bash
# UFW
ufw allow 6680/tcp

# iptables
iptables -A INPUT -p tcp --dport 6680 -j ACCEPT
```

---

## 🐛 Troubleshooting

### Lỗi yt-dlp không tìm thấy

```bash
# Kiểm tra path
which yt-dlp
/usr/local/bin/yt-dlp --version

# Cập nhật yt-dlp
yt-dlp -U
```

### Lỗi ffmpeg

```bash
apt-get install -y ffmpeg
ffmpeg -version
```

### ESP32 lỗi SSL/Download empty

Nguyên nhân: Server response quá chậm hoặc stream bị ngắt

Giải pháp:
1. Dùng `format=proxy` thay vì direct URL
2. Tăng timeout trên ESP32
3. Kiểm tra logs: `pm2 logs youtube-mp3-api`

### Restart hoàn toàn

```bash
pm2 delete all
pm2 kill
cd /root/youtube_mp3_api
rm -rf node_modules
npm install
pm2 start ecosystem.config.js
pm2 save
```

---

## 📱 ESP32 Config

Cấu hình ESP32 kết nối đến server:

```cpp
#define MUSIC_API_HOST "YOUR_SERVER_IP"
#define MUSIC_API_PORT 6680
#define MUSIC_API_PATH "/stream_pcm?song=%s&artist=%s"
```

URL mẫu cho ESP32:
```
http://YOUR_SERVER_IP:6680/stream_pcm?song=Lac+Troi&artist=Son+Tung
```

---

## 🐳 Deploy với Docker (Alternative)

```bash
# Build
docker build -t youtube-mp3-api .

# Run
docker run -d \
  --name youtube-mp3-api \
  -p 6680:6680 \
  --restart unless-stopped \
  youtube-mp3-api

# Logs
docker logs -f youtube-mp3-api
```

Hoặc dùng docker-compose:

```bash
docker-compose up -d
docker-compose logs -f
```
