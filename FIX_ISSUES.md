# Fix Issues - Khắc phục vấn đề

## Vấn đề: Server không thể truy cập (http://192.168.1.5:6666/health)

### Bước 1: Kiểm tra logs

```bash
# Xem logs lỗi
pm2 logs youtube-mp3-api --err --lines 50

# Xem tất cả logs
pm2 logs youtube-mp3-api --lines 100
```

**Tìm các lỗi phổ biến:**
- `Cannot find module` → Cần `npm install`
- `EADDRINUSE` → Port đã được sử dụng
- `Error: listen` → Lỗi bind port

### Bước 2: Kiểm tra dependencies

```bash
cd /root/youtube_mp3_api
npm install
```

### Bước 3: Restart PM2

```bash
# Stop và delete
pm2 stop youtube-mp3-api
pm2 delete youtube-mp3-api

# Start lại
pm2 start ecosystem.config.js

# Kiểm tra status
pm2 status
pm2 show youtube-mp3-api
```

### Bước 4: Kiểm tra port

```bash
# Xem port có đang được dùng không
lsof -i :6666
# Hoặc
netstat -tulpn | grep 6666

# Nếu có process khác đang dùng:
kill -9 <PID>
```

### Bước 5: Test localhost trước

```bash
# Test từ server
curl http://localhost:6666/health

# Nếu localhost OK nhưng IP không OK:
# - Kiểm tra firewall
# - Kiểm tra server có bind 0.0.0.0 không
```

### Bước 6: Kiểm tra firewall

```bash
# Ubuntu/Debian
sudo ufw allow 6666/tcp
sudo ufw reload

# CentOS/RHEL
sudo firewall-cmd --add-port=6666/tcp --permanent
sudo firewall-cmd --reload
```

### Bước 7: Chạy trực tiếp để debug

```bash
# Stop PM2
pm2 stop youtube-mp3-api

# Chạy trực tiếp để xem lỗi
node server.js
```

Nếu chạy trực tiếp OK → Vấn đề ở PM2 config
Nếu chạy trực tiếp lỗi → Xem error message và fix

### Bước 8: Kiểm tra IP binding

Server đã được cấu hình bind `0.0.0.0` để có thể truy cập từ mạng local.

Nếu vẫn không được, thử:
```bash
# Test từ server
curl http://127.0.0.1:6666/health
curl http://localhost:6666/health
curl http://192.168.1.5:6666/health
```

## Quick Fix Commands

```bash
# 1. Reinstall dependencies
cd /root/youtube_mp3_api
rm -rf node_modules
npm install

# 2. Restart PM2
pm2 restart youtube-mp3-api

# 3. Check logs
pm2 logs youtube-mp3-api --lines 50

# 4. Test
curl http://localhost:6666/health
```

## Nếu vẫn không được

1. **Xem logs chi tiết:**
   ```bash
   pm2 logs youtube-mp3-api --lines 200 --err
   ```

2. **Chạy trực tiếp:**
   ```bash
   pm2 stop youtube-mp3-api
   node server.js
   ```

3. **Kiểm tra file logs:**
   ```bash
   cat logs/pm2-error.log
   cat logs/pm2-out.log
   ```

4. **Kiểm tra dependencies:**
   ```bash
   node -e "require('express'); require('ytdl-core'); require('youtube-sr'); console.log('OK')"
   ```

## Common Errors

### Error: Cannot find module 'express'
```bash
npm install
```

### Error: Port 6666 already in use
```bash
# Tìm process
lsof -i :6666
# Kill process
kill -9 <PID>
# Hoặc đổi port trong ecosystem.config.js
```

### Error: wait_ready timeout
- Server chưa gửi signal 'ready'
- Đã fix trong server.js (thêm `process.send('ready')`)
- Restart PM2: `pm2 restart youtube-mp3-api`

### Error: EADDRINUSE
- Port đã được sử dụng
- Đổi port hoặc kill process đang dùng port







