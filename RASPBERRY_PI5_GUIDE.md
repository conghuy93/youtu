# Hướng dẫn chạy trên Raspberry Pi 5

Hướng dẫn chi tiết cài đặt và chạy YouTube MP3/MP4 API trên Raspberry Pi 5.

## Yêu cầu hệ thống

- Raspberry Pi 5 (hoặc Pi 4)
- Raspberry Pi OS (Debian-based)
- Kết nối internet
- Ít nhất 2GB RAM còn trống
- 1GB dung lượng ổ cứng

## Bước 1: Cập nhật hệ thống

```bash
sudo apt update
sudo apt upgrade -y
```

## Bước 2: Cài đặt Node.js

### Option A: Cài đặt Node.js 20.x (Khuyến nghị)

```bash
# Cài đặt Node.js 20.x từ NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Kiểm tra phiên bản
node -v   # Nên là v20.x.x
npm -v    # Nên là 10.x.x
```

### Option B: Cài đặt Node.js 18.x (Ổn định)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

## Bước 3: Cài đặt FFmpeg (Bắt buộc)

FFmpeg cần thiết để xử lý audio/video:

```bash
sudo apt install -y ffmpeg

# Kiểm tra cài đặt
ffmpeg -version
```

## Bước 4: Cài đặt Git (nếu chưa có)

```bash
sudo apt install -y git
```

## Bước 5: Clone/Copy code

### Option A: Clone từ repository (nếu có)

```bash
cd ~
git clone <repository-url> youtube_mp3_api
cd youtube_mp3_api
```

### Option B: Copy từ máy khác

Sử dụng SCP hoặc USB để copy thư mục vào Pi:

```bash
# Trên máy Windows, dùng WinSCP hoặc terminal:
# scp -r "f:\code\youtube_mp3_api - Copy (5)\youtube_mp3_api - Copy (5)" pi@<pi-ip>:~/youtube_mp3_api

# Hoặc copy vào USB rồi mount trên Pi:
sudo mount /dev/sda1 /mnt/usb
cp -r /mnt/usb/youtube_mp3_api ~/youtube_mp3_api
cd ~/youtube_mp3_api
```

## Bước 6: Cài đặt dependencies

```bash
cd ~/youtube_mp3_api

# Xóa node_modules cũ nếu có (từ Windows)
rm -rf node_modules
rm -f package-lock.json

# Cài đặt dependencies
npm install

# Nếu gặp lỗi, thử:
npm install --legacy-peer-deps
```

**Thời gian cài đặt:** 5-10 phút trên Pi 5.

## Bước 7: Kiểm tra cài đặt

```bash
# Test imports
node test_imports.js

# Kết quả mong đợi:
# ✓ express loaded
# ✓ cors loaded
# ✓ axios loaded
# ✓ @distube/ytdl-core loaded
# ✓ youtube-sr loaded
# ✓ fluent-ffmpeg loaded
# All imports successful!
```

## Bước 8: Chạy server

### Option A: Chạy trực tiếp (Test)

```bash
npm start
# Hoặc
node server.js
```

Server sẽ chạy tại: `http://localhost:6680`

### Option B: Chạy với PM2 (Khuyến nghị - Production)

PM2 giúp server tự động restart nếu crash và chạy lại khi Pi reboot.

```bash
# Cài đặt PM2 globally
sudo npm install -g pm2

# Start server với PM2
pm2 start ecosystem.config.js

# Hoặc
npm run pm2:start

# Xem logs
pm2 logs youtube-mp3-api

# Xem status
pm2 status

# Cấu hình PM2 tự chạy khi boot
pm2 startup
# Chạy lệnh mà PM2 hiển thị (bắt đầu với sudo...)
pm2 save
```

### Các lệnh PM2 hữu ích:

```bash
# Xem logs real-time
pm2 logs youtube-mp3-api

# Stop server
pm2 stop youtube-mp3-api

# Restart server
pm2 restart youtube-mp3-api

# Xóa khỏi PM2
pm2 delete youtube-mp3-api

# Monitor CPU/Memory
pm2 monit
```

## Bước 9: Kiểm tra hoạt động

### Test từ Pi:

```bash
# Test health endpoint
curl http://localhost:6680/health

# Test search
curl "http://localhost:6680/api/search?q=test"

# Test info
curl "http://localhost:6680/api/info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

### Test từ máy khác trong mạng:

1. Lấy IP của Pi:
```bash
hostname -I
# Ví dụ: 192.168.1.100
```

2. Truy cập từ browser trên máy khác:
```
http://192.168.1.100:6680
```

## Bước 10: Cấu hình firewall (nếu có)

```bash
# Cho phép port 6680
sudo ufw allow 6680/tcp

# Hoặc nếu dùng iptables:
sudo iptables -A INPUT -p tcp --dport 6680 -j ACCEPT
sudo iptables-save
```

## Tối ưu hóa cho Raspberry Pi 5

### 1. Giảm bộ nhớ cache

Sửa trong [server.js](server.js):

```javascript
// Giảm max cache size
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB thay vì 500MB
```

### 2. Giảm số worker processes (nếu dùng cluster)

Trên Pi, nên dùng 1-2 worker thay vì nhiều:

```javascript
const numWorkers = 1; // hoặc 2 tối đa
```

### 3. Monitor resource usage

```bash
# Xem CPU và Memory
htop

# Hoặc
top

# Hoặc với PM2
pm2 monit
```

### 4. Thiết lập swap (nếu RAM < 4GB)

```bash
# Tạo swap file 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Cấu hình tự động mount
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Troubleshooting

### Lỗi: Cannot find module

```bash
cd ~/youtube_mp3_api
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Lỗi: ffmpeg not found

```bash
sudo apt update
sudo apt install -y ffmpeg
```

### Server chậm/timeout

- Giảm quality trong request (`quality=low`)
- Tăng swap memory
- Chỉ download MP3 thay vì MP4

### Port 6680 đã được sử dụng

```bash
# Tìm process đang dùng port
sudo lsof -i :6680

# Kill process
sudo kill -9 <PID>

# Hoặc đổi port trong server.js
# const PORT = process.env.PORT || 7000;
```

### Không truy cập được từ mạng ngoài

```bash
# Kiểm tra IP
hostname -I

# Kiểm tra firewall
sudo ufw status

# Cho phép port
sudo ufw allow 6680/tcp
```

## Cấu hình nâng cao

### 1. Chạy trên port 80 (HTTP mặc định)

```bash
# Option A: Dùng reverse proxy với Nginx
sudo apt install -y nginx

# Cấu hình Nginx
sudo nano /etc/nginx/sites-available/youtube-api

# Paste:
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:6680;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/youtube-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 2. Tự động cập nhật yt-dlp

Tạo cron job để cập nhật yt-dlp mỗi tuần:

```bash
# Cài đặt yt-dlp
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# Cron job
crontab -e

# Thêm dòng (cập nhật mỗi Chủ nhật 3am):
0 3 * * 0 sudo yt-dlp -U
```

### 3. Log rotation

```bash
# Cấu hình PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Performance trên Pi 5

### Benchmark (dự kiến):

- **Search:** 1-2 giây
- **Get info:** 2-3 giây
- **Stream MP3 (128kbps):** Real-time, không lag
- **Download MP3:** Tốc độ tùy thuộc internet
- **Download MP4:** Chậm hơn, khuyến nghị quality=low

### Tips tăng tốc:

1. **Sử dụng ethernet** thay vì WiFi
2. **Overclock Pi 5** (nếu có tản nhiệt):
   ```bash
   sudo nano /boot/config.txt
   # Thêm:
   over_voltage=6
   arm_freq=2800
   ```
3. **Sử dụng SSD** thay vì SD card (cho cache)
4. **Cache responses** để giảm API calls

## Bảo mật

### 1. Thêm API key (khuyến nghị)

Sửa [server.js](server.js) để thêm authentication:

```javascript
const API_KEY = process.env.API_KEY || 'your-secret-key';

app.use('/api/*', (req, res, next) => {
    const key = req.headers['x-api-key'] || req.query.key;
    if (key !== API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
});
```

### 2. Rate limiting

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Monitoring

### 1. Xem status với PM2

```bash
pm2 status
pm2 monit
pm2 logs youtube-mp3-api --lines 100
```

### 2. Cài đặt PM2 web dashboard

```bash
pm2 web
# Truy cập: http://<pi-ip>:9615
```

### 3. Health check endpoint

```bash
# Tạo cron job kiểm tra mỗi 5 phút
crontab -e

# Thêm:
*/5 * * * * curl -s http://localhost:6680/health > /dev/null || pm2 restart youtube-mp3-api
```

## Backup & Restore

### Backup

```bash
# Backup toàn bộ project
cd ~
tar -czf youtube_mp3_api_backup_$(date +%Y%m%d).tar.gz youtube_mp3_api/

# Backup chỉ config và code (không có node_modules)
tar -czf youtube_mp3_api_backup_$(date +%Y%m%d).tar.gz \
    --exclude='node_modules' \
    --exclude='cache' \
    youtube_mp3_api/
```

### Restore

```bash
# Extract backup
tar -xzf youtube_mp3_api_backup_*.tar.gz

# Cài đặt lại dependencies
cd youtube_mp3_api
npm install

# Restart
pm2 restart youtube-mp3-api
```

## Kết luận

Server YouTube MP3/MP4 API hoạt động tốt trên Raspberry Pi 5 với:

✅ **Performance:** Đủ tốt cho 5-10 concurrent users  
✅ **Reliability:** Ổn định với PM2  
✅ **Power consumption:** Chỉ ~5-10W  
✅ **24/7 operation:** Có thể chạy liên tục  

**Khuyến nghị:**
- Dùng Pi 5 với 4GB+ RAM
- Cài đặt tản nhiệt tốt
- Sử dụng nguồn chính hãng
- Backup định kỳ

## Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. [INSTALL_GUIDE.md](INSTALL_GUIDE.md)
3. Logs: `pm2 logs youtube-mp3-api`
4. System logs: `sudo journalctl -u pm2-pi`

---

**Chúc bạn thành công! 🎉**
