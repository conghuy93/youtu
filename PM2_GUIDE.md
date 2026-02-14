# PM2 Guide - Hướng dẫn sử dụng PM2

## Cài đặt PM2

### Global installation (khuyến nghị)
```bash
npm install -g pm2
```

### Local installation
```bash
cd D:\OTTO\youtube_mp3_api
npm install
```

## Sử dụng PM2

### 1. Start server với PM2
```bash
npm run pm2:start
# Hoặc
pm2 start ecosystem.config.js
```

### 2. Xem danh sách processes
```bash
pm2 list
```

### 3. Xem logs
```bash
npm run pm2:logs
# Hoặc
pm2 logs youtube-mp3-api
```

### 4. Xem logs real-time
```bash
pm2 logs youtube-mp3-api --lines 100
```

### 5. Stop server
```bash
npm run pm2:stop
# Hoặc
pm2 stop youtube-mp3-api
```

### 6. Restart server
```bash
npm run pm2:restart
# Hoặc
pm2 restart youtube-mp3-api
```

### 7. Delete process
```bash
npm run pm2:delete
# Hoặc
pm2 delete youtube-mp3-api
```

### 8. Monitor (real-time monitoring)
```bash
npm run pm2:monit
# Hoặc
pm2 monit
```

## Các lệnh PM2 hữu ích

### Xem thông tin chi tiết
```bash
pm2 show youtube-mp3-api
```

### Xem stats
```bash
pm2 status
```

### Reload (zero-downtime restart)
```bash
pm2 reload youtube-mp3-api
```

### Save PM2 process list
```bash
pm2 save
```

### Startup script (tự động start khi boot)
```bash
pm2 startup
pm2 save
```

### Xóa logs cũ
```bash
pm2 flush
```

### Restart tất cả
```bash
pm2 restart all
```

### Stop tất cả
```bash
pm2 stop all
```

## Cấu hình Ecosystem

File `ecosystem.config.js` đã được cấu hình với:

- **Name**: `youtube-mp3-api`
- **Instances**: 1 (có thể đổi thành `'max'` để dùng tất cả CPU cores)
- **Memory limit**: 500MB (tự động restart nếu vượt)
- **Auto restart**: Bật
- **Logs**: Lưu trong thư mục `./logs/`
- **Port**: 6666

### Chạy với nhiều instances (Cluster mode)

Sửa `ecosystem.config.js`:
```javascript
instances: 'max', // Dùng tất cả CPU cores
exec_mode: 'cluster', // Cluster mode
```

Sau đó restart:
```bash
pm2 restart youtube-mp3-api
```

## Monitoring

### PM2 Plus (Cloud monitoring)
```bash
pm2 link
```

### Local monitoring
```bash
pm2 monit
```

## Logs

Logs được lưu trong thư mục `./logs/`:
- `pm2-error.log`: Error logs
- `pm2-out.log`: Output logs

### Xem logs theo thời gian
```bash
pm2 logs youtube-mp3-api --lines 100 --nostream
```

### Xóa logs
```bash
pm2 flush youtube-mp3-api
```

## Troubleshooting

### Process không start
```bash
# Xem logs
pm2 logs youtube-mp3-api --err

# Xem thông tin chi tiết
pm2 show youtube-mp3-api
```

### Process bị crash liên tục
```bash
# Kiểm tra logs
pm2 logs youtube-mp3-api --lines 200

# Kiểm tra memory
pm2 monit
```

### Port đã được sử dụng
```bash
# Đổi port trong ecosystem.config.js
env: {
  PORT: 7777
}

# Restart
pm2 restart youtube-mp3-api
```

## Auto-start khi boot (Windows)

### Cách 1: Dùng PM2 startup
```bash
pm2 startup
pm2 save
```

### Cách 2: Dùng Task Scheduler
1. Mở Task Scheduler
2. Tạo task mới
3. Trigger: At startup
4. Action: Start program
5. Program: `pm2`
6. Arguments: `resurrect`

## Auto-start khi boot (Linux)

```bash
pm2 startup systemd
pm2 save
```

## Scripts trong package.json

Đã thêm các scripts tiện lợi:

```json
{
  "pm2:start": "pm2 start ecosystem.config.js",
  "pm2:stop": "pm2 stop youtube-mp3-api",
  "pm2:restart": "pm2 restart youtube-mp3-api",
  "pm2:delete": "pm2 delete youtube-mp3-api",
  "pm2:logs": "pm2 logs youtube-mp3-api",
  "pm2:monit": "pm2 monit"
}
```

## Best Practices

1. **Luôn save sau khi thay đổi**
   ```bash
   pm2 save
   ```

2. **Monitor memory usage**
   ```bash
   pm2 monit
   ```

3. **Rotate logs định kỳ**
   ```bash
   pm2 install pm2-logrotate
   ```

4. **Backup ecosystem.config.js**
   - Giữ file này trong git
   - Cập nhật khi thay đổi cấu hình

5. **Health check**
   ```bash
   curl http://localhost:6666/health
   ```

## Performance

### Single instance (mặc định)
- Phù hợp cho: < 100 concurrent users
- Memory: ~100-200MB
- CPU: 1 core

### Cluster mode (instances: 'max')
- Phù hợp cho: > 100 concurrent users
- Memory: ~100-200MB per instance
- CPU: Tất cả cores

## Ví dụ workflow

```bash
# 1. Start server
npm run pm2:start

# 2. Kiểm tra status
pm2 status

# 3. Xem logs
npm run pm2:logs

# 4. Monitor
npm run pm2:monit

# 5. Khi cần restart
npm run pm2:restart

# 6. Khi cần stop
npm run pm2:stop
```







