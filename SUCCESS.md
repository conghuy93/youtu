# ✅ Server đã chạy thành công!

## Status
- **Status**: online ✅
- **Memory**: 86.1mb ✅
- **Restarts**: 0 ✅

## Test API

### 1. Health Check
```bash
curl http://localhost:6666/health
```

Hoặc từ mạng:
```bash
curl http://192.168.1.5:6666/health
```

### 2. Get Video Info
```bash
curl "http://localhost:6666/api/info?id=dQw4w9WgXcQ"
```

### 3. Search Videos
```bash
curl "http://localhost:6666/api/search?q=music&limit=10"
```

### 4. Download MP3
```bash
curl "http://localhost:6666/api/mp3?id=dQw4w9WgXcQ" -o song.mp3
```

### 5. Stream MP3
Trong browser hoặc audio player:
```
http://192.168.1.5:6666/api/stream/mp3?id=dQw4w9WgXcQ
```

### 6. Stats
```bash
curl http://localhost:6666/stats
```

## PM2 Commands

```bash
# Xem logs
pm2 logs youtube-mp3-api

# Monitor
pm2 monit

# Restart
pm2 restart youtube-mp3-api

# Stop
pm2 stop youtube-mp3-api
```

## API Endpoints

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/health` | GET | Health check |
| `/api/info?id=...` | GET | Get video info |
| `/api/mp3?id=...` | GET | Download MP3 |
| `/api/mp4?id=...` | GET | Download MP4 |
| `/api/stream/mp3?id=...` | GET | Stream MP3 |
| `/api/search?q=...` | GET | Search videos |
| `/stats` | GET | Server statistics |

## Ví dụ sử dụng

### JavaScript
```javascript
const axios = require('axios');

// Get info
const info = await axios.get('http://localhost:6666/api/info?id=dQw4w9WgXcQ');
console.log(info.data.data.title);

// Search
const results = await axios.get('http://localhost:6666/api/search?q=music');
console.log(results.data.data);
```

### PHP
```php
// Get info
$info = json_decode(file_get_contents('http://localhost:6666/api/info?id=dQw4w9WgXcQ'), true);
echo $info['data']['title'];

// Download MP3
$mp3 = file_get_contents('http://localhost:6666/api/mp3?id=dQw4w9WgXcQ');
file_put_contents('song.mp3', $mp3);
```

### Python
```python
import requests

# Get info
response = requests.get('http://localhost:6666/api/info?id=dQw4w9WgXcQ')
data = response.json()
print(data['data']['title'])

# Download MP3
mp3 = requests.get('http://localhost:6666/api/mp3?id=dQw4w9WgXcQ')
with open('song.mp3', 'wb') as f:
    f.write(mp3.content)
```

## Troubleshooting

### Không truy cập được từ mạng
1. Kiểm tra firewall:
   ```bash
   sudo ufw allow 6666/tcp
   ```

2. Kiểm tra server có bind 0.0.0.0:
   - Đã được cấu hình trong server.js

3. Test từ server:
   ```bash
   curl http://localhost:6666/health
   curl http://192.168.1.5:6666/health
   ```

### API trả về lỗi
- Xem logs: `pm2 logs youtube-mp3-api`
- Kiểm tra video ID có hợp lệ không
- Thử video khác

## Next Steps

1. ✅ Server đã chạy
2. ⏭️ Test API endpoints
3. ⏭️ Tích hợp vào ứng dụng của bạn
4. ⏭️ Monitor performance với `pm2 monit`

## Chúc mừng! 🎉

Server YouTube MP3 API của bạn đã sẵn sàng sử dụng!







