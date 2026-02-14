# Installation Guide - Hướng dẫn cài đặt

## Vấn đề: Cannot find module 'express'

Lỗi này xảy ra vì **chưa cài đặt dependencies**. Thực hiện các bước sau:

## Cách 1: Cài đặt tự động (Khuyến nghị)

```bash
cd /root/youtube_mp3_api
chmod +x install.sh
./install.sh
```

## Cách 2: Cài đặt thủ công

### Bước 1: Xóa node_modules cũ (nếu có)
```bash
cd /root/youtube_mp3_api
rm -rf node_modules
rm -f package-lock.json
```

### Bước 2: Clear npm cache
```bash
npm cache clean --force
```

### Bước 3: Cài đặt dependencies
```bash
npm install
```

### Bước 4: Kiểm tra
```bash
node test_imports.js
```

Nếu OK → Tiếp tục  
Nếu lỗi → Xem phần Troubleshooting

## Cách 3: Cài đặt với force (nếu có conflict)

```bash
npm install --force
```

Hoặc:
```bash
npm install --legacy-peer-deps
```

## Kiểm tra sau khi cài đặt

```bash
# Test imports
node test_imports.js

# Test server
node server.js
```

Nếu chạy OK → Start với PM2:
```bash
pm2 start ecosystem.config.js
```

## Dependencies cần thiết

- `express` - Web framework
- `cors` - CORS middleware
- `axios` - HTTP client
- `@distube/ytdl-core` - YouTube downloader (version mới, ổn định hơn)
- `youtube-sr` - YouTube search
- `fluent-ffmpeg` - Video/audio processing

## Troubleshooting

### Lỗi: npm install failed - network error
```bash
# Thử registry khác
npm install --registry https://registry.npmmirror.com
```

### Lỗi: npm install failed - permission denied
```bash
# Fix permissions
sudo chown -R $USER:$USER /root/youtube_mp3_api
npm install
```

### Lỗi: Module not found sau khi install
```bash
# Reinstall
rm -rf node_modules package-lock.json
npm install
```

### Lỗi: @distube/ytdl-core not found
```bash
# Fallback về ytdl-core
npm install ytdl-core
```

Sau đó sửa server.js:
```javascript
const ytdl = require('ytdl-core');
```

## Quick Commands

```bash
# Full reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Test
node test_imports.js
node server.js

# Start PM2
pm2 start ecosystem.config.js
```

## Sau khi cài đặt thành công

1. **Test imports:**
   ```bash
   node test_imports.js
   ```

2. **Test server:**
   ```bash
   node server.js
   ```

3. **Start với PM2:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 logs youtube-mp3-api
   ```

4. **Test API:**
   ```bash
   curl http://localhost:6666/health
   ```







