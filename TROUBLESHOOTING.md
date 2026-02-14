# Troubleshooting Guide

## Vấn đề: Server không thể truy cập

### 1. Kiểm tra logs

```bash
# Xem logs lỗi
pm2 logs youtube-mp3-api --err

# Xem tất cả logs
pm2 logs youtube-mp3-api --lines 100

# Xem logs real-time
pm2 logs youtube-mp3-api
```

### 2. Kiểm tra status

```bash
pm2 status
pm2 show youtube-mp3-api
```

### 3. Kiểm tra port

```bash
# Linux/Mac
netstat -tulpn | grep 6666
# Hoặc
lsof -i :6666

# Windows
netstat -ano | findstr :6666
```

Nếu port đã được sử dụng:
- Đổi port trong `ecosystem.config.js`
- Hoặc stop process đang dùng port đó

### 4. Kiểm tra firewall

```bash
# Linux (Ubuntu/Debian)
sudo ufw allow 6666

# Linux (CentOS/RHEL)
sudo firewall-cmd --add-port=6666/tcp --permanent
sudo firewall-cmd --reload
```

### 5. Kiểm tra IP binding

Server mặc định bind `0.0.0.0` để có thể truy cập từ mạng local.

Nếu chỉ muốn localhost:
```javascript
app.listen(PORT, '127.0.0.1', () => {
  // ...
});
```

### 6. Lỗi thường gặp

#### Lỗi: "Cannot find module"
```bash
# Cài đặt lại dependencies
npm install
```

#### Lỗi: "Port already in use"
```bash
# Tìm process đang dùng port
lsof -i :6666

# Kill process
kill -9 <PID>

# Hoặc đổi port
# Sửa PORT trong ecosystem.config.js
```

#### Lỗi: "wait_ready timeout"
- Server chưa gửi signal 'ready'
- Kiểm tra logs để xem lỗi gì
- Tăng `listen_timeout` trong ecosystem.config.js

#### Lỗi: "EADDRINUSE"
- Port đã được sử dụng
- Đổi port hoặc stop process khác

### 7. Restart server

```bash
# Restart
pm2 restart youtube-mp3-api

# Hoặc stop và start lại
pm2 stop youtube-mp3-api
pm2 start ecosystem.config.js
```

### 8. Test từ server

```bash
# Test localhost
curl http://localhost:6666/health

# Test từ IP
curl http://192.168.1.5:6666/health
```

### 9. Kiểm tra dependencies

```bash
# Kiểm tra các module đã cài chưa
node -e "require('express'); require('ytdl-core'); require('youtube-sr'); console.log('OK')"
```

### 10. Debug mode

Chạy trực tiếp (không qua PM2) để xem lỗi:
```bash
node server.js
```

## Checklist

- [ ] PM2 đã start thành công (`pm2 status` shows "online")
- [ ] Port 6666 không bị chiếm bởi process khác
- [ ] Firewall cho phép port 6666
- [ ] Server bind đúng IP (0.0.0.0 cho mạng local)
- [ ] Dependencies đã được cài đặt (`npm install`)
- [ ] Logs không có lỗi (`pm2 logs`)
- [ ] Test localhost thành công (`curl http://localhost:6666/health`)

## Liên hệ hỗ trợ

Nếu vẫn không giải quyết được:
1. Chạy `pm2 logs youtube-mp3-api --lines 200` và gửi logs
2. Chạy `pm2 show youtube-mp3-api` và gửi output
3. Chạy `node server.js` trực tiếp và gửi error message







