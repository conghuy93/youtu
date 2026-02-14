# Quick Fix - App đang crash liên tục

## Vấn đề
- Status: "waiting restart"
- Restarts: 6+
- Memory: 0b (app không start được)

## Giải pháp nhanh

### Bước 1: Xem logs để biết lỗi gì
```bash
pm2 logs youtube-mp3-api --err --lines 50
```

### Bước 2: Test imports
```bash
cd /root/youtube_mp3_api
node test_imports.js
```

Nếu có lỗi "Cannot find module" → Chạy:
```bash
npm install
```

### Bước 3: Test chạy trực tiếp
```bash
# Stop PM2
pm2 stop youtube-mp3-api
pm2 delete youtube-mp3-api

# Chạy trực tiếp để xem lỗi
node server.js
```

### Bước 4: Fix lỗi và restart

Sau khi fix lỗi, restart PM2:
```bash
pm2 start ecosystem.config.js
pm2 logs youtube-mp3-api
```

## Lỗi thường gặp

### 1. Cannot find module 'youtube-sr'
```bash
npm install youtube-sr
```

### 2. Cannot find module 'ytdl-core'
```bash
npm install ytdl-core
```

### 3. SyntaxError
- Kiểm tra server.js có lỗi syntax không
- Chạy: `node -c server.js`

### 4. Port already in use
```bash
# Tìm process
lsof -i :6666
# Kill process
kill -9 <PID>
```

## Commands hữu ích

```bash
# Xem logs
pm2 logs youtube-mp3-api --lines 100

# Xem error logs
pm2 logs youtube-mp3-api --err --lines 50

# Test imports
node test_imports.js

# Test server trực tiếp
node server.js

# Reinstall dependencies
rm -rf node_modules
npm install
```







