# Quick Start Guide

## Cài đặt nhanh

### Bước 1: Cài đặt dependencies
```bash
cd D:\OTTO\youtube_mp3_api
npm install
```

### Bước 2: Start server
```bash
npm start
```

Server sẽ chạy tại: `http://localhost:6666`

## Test nhanh

### 1. Health check
```bash
curl http://localhost:6666/health
```

### 2. Get video info
```bash
curl "http://localhost:6666/api/info?id=dQw4w9WgXcQ"
```

### 3. Download MP3
```bash
curl "http://localhost:6666/api/mp3?id=dQw4w9WgXcQ" -o test.mp3
```

### 4. Search videos
```bash
curl "http://localhost:6666/api/search?q=never%20gonna%20give%20you%20up"
```

## Sử dụng trong code

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Get video info
const info = await axios.get('http://localhost:6666/api/info?id=dQw4w9WgXcQ');
console.log(info.data.data.title);

// Search
const results = await axios.get('http://localhost:6666/api/search?q=music');
console.log(results.data.data);
```

### PHP
```php
// Get video info
$info = file_get_contents('http://localhost:6666/api/info?id=dQw4w9WgXcQ');
$data = json_decode($info, true);
echo $data['data']['title'];

// Download MP3
$mp3 = file_get_contents('http://localhost:6666/api/mp3?id=dQw4w9WgXcQ');
file_put_contents('song.mp3', $mp3);
```

### Python
```python
import requests

# Get video info
response = requests.get('http://localhost:6666/api/info?id=dQw4w9WgXcQ')
data = response.json()
print(data['data']['title'])

# Download MP3
mp3 = requests.get('http://localhost:6666/api/mp3?id=dQw4w9WgXcQ')
with open('song.mp3', 'wb') as f:
    f.write(mp3.content)
```

## Troubleshooting

### Lỗi: Cannot find module
→ Chạy `npm install`

### Lỗi: Port already in use
→ Đổi port: `PORT=7777 npm start`

### Lỗi: Video unavailable
→ Video có thể bị private hoặc deleted







