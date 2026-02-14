# YouTube MP3/MP4 API

API server để download và stream MP3/MP4 từ YouTube, **tương tự cấu trúc ZingMP3 proxy** (`nodejs_proxy`).

## Đặc điểm

- ✅ **Cấu trúc tương tự ZingMP3 proxy** - Dễ migrate và sử dụng
- ✅ **Tương thích ESP32/AI** - Response format giống nhau
- ✅ **Auto search YouTube** - Tự động tìm video từ tên bài hát
- ✅ **Stream support** - Hỗ trợ HTTP Range requests
- ✅ **Lyrics support** - Lấy captions từ YouTube làm lyrics

## Tham khảo

Dự án này được xây dựng dựa trên các nguồn:
- [MichaelBelgium/Youtube-API](https://github.com/MichaelBelgium/Youtube-API)
- [MatheusIshiyama/youtube-download-api](https://github.com/MatheusIshiyama/youtube-download-api)
- [Dalero/YouTube-MP3-API-iFrame](https://github.com/Dalero/YouTube-MP3-API-iFrame)
- [awesome-yasin/Media-Downloader](https://github.com/awesome-yasin/Media-Downloader)
- [coolguruji/youtube-to-mp3-api](https://github.com/coolguruji/youtube-to-mp3-api)

## Cài đặt

### Yêu cầu
- Node.js 16+
- npm hoặc yarn

### Cài đặt dependencies

```bash
cd D:\OTTO\youtube_mp3_api
npm install
```

### Start server

**Option 1: Với PM2 (Khuyến nghị)**
```bash
# Cài đặt PM2 (nếu chưa có)
npm install -g pm2

# Start với PM2
npm run pm2:start
# Hoặc
pm2 start ecosystem.config.js
```

**Option 2: Chạy trực tiếp**
```bash
npm start
```

Server sẽ chạy tại: `http://localhost:6666`

### PM2 Commands

```bash
npm run pm2:start    # Start server
npm run pm2:stop     # Stop server
npm run pm2:restart  # Restart server
npm run pm2:logs     # Xem logs
npm run pm2:monit    # Monitor
```

Xem chi tiết: `PM2_GUIDE.md`

## API Endpoints

### 1. Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "YouTube MP3/MP4 API",
  "uptime": 3600
}
```

### 2. Get Video Info
```
GET /api/info?url=<youtube_url>
GET /api/info?id=<video_id>
```

**Parameters:**
- `url` (optional): YouTube URL (https://www.youtube.com/watch?v=...)
- `id` (optional): Video ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "dQw4w9WgXcQ",
    "title": "Video Title",
    "description": "Video description...",
    "thumbnail": "https://...",
    "duration": 212,
    "durationFormatted": "3:32",
    "author": "Channel Name",
    "viewCount": "1234567",
    "uploadDate": "2023-01-01",
    "formats": [...]
  }
}
```

### 3. Download MP3
```
GET /api/mp3?url=<youtube_url>
GET /api/mp3?id=<video_id>&quality=highestaudio
```

**Parameters:**
- `url` (optional): YouTube URL
- `id` (optional): Video ID
- `quality` (optional): Audio quality (default: `highestaudio`)

**Response:** MP3 file download

### 4. Download MP4
```
GET /api/mp4?url=<youtube_url>
GET /api/mp4?id=<video_id>&quality=highest
```

**Parameters:**
- `url` (optional): YouTube URL
- `id` (optional): Video ID
- `quality` (optional): Video quality (default: `highest`)

**Response:** MP4 file download

### 5. Stream MP3
```
GET /api/stream/mp3?url=<youtube_url>
GET /api/stream/mp3?id=<video_id>
```

**Response:** MP3 audio stream (không download file)

### 6. Search Videos
```
GET /api/search?q=<query>&limit=20
```

**Parameters:**
- `q` (required): Search query
- `limit` (optional): Number of results (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "dQw4w9WgXcQ",
      "title": "Video Title",
      "description": "...",
      "thumbnail": "https://...",
      "duration": "3:32",
      "durationSeconds": 212,
      "url": "https://...",
      "channel": {
        "name": "Channel Name",
        "url": "https://..."
      },
      "views": 1234567,
      "uploadedAt": "2023-01-01"
    }
  ]
}
```

### 7. Stats
```
GET /stats
```

**Response:**
```json
{
  "uptime_seconds": 3600,
  "total_requests": 1234,
  "errors": 5,
  "downloads": {
    "mp3": 100,
    "mp4": 50
  },
  "memory_mb": {
    "rss": 128,
    "heap_used": 64,
    "heap_total": 96
  }
}
```

## Ví dụ sử dụng

### Test nhanh trên trình duyệt

Server phục vụ sẵn trang test UI tại:

```
http://localhost:6666/
```

Chức năng:

- Tìm bài hát bằng `/api/search`
- Chọn video và phát thử qua `/api/stream/mp3` với các format `url`, `proxy`, `stream`
- Nghe trực tiếp bằng audio player tích hợp
- Copy nhanh các lệnh `curl` để test trên terminal

### Get video info
```bash
curl "http://localhost:6666/api/info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

### Download MP3
```bash
curl "http://localhost:6666/api/mp3?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ" -o song.mp3
```

### Download MP4
```bash
curl "http://localhost:6666/api/mp4?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ" -o video.mp4
```

### Stream MP3
```bash
# Trong browser hoặc audio player
http://localhost:6666/api/stream/mp3?id=dQw4w9WgXcQ
```

### Search videos
```bash
curl "http://localhost:6666/api/search?q=never%20gonna%20give%20you%20up"
```

## Cấu trúc tương tự ZingMP3 Proxy

- ✅ Express server với CORS
- ✅ Metrics và stats tracking
- ✅ Error handling
- ✅ Health check endpoint
- ✅ RESTful API design
- ✅ Stream support

## Lưu ý

1. **Rate Limiting**: YouTube có thể rate limit nếu request quá nhiều
2. **Legal**: Chỉ sử dụng cho mục đích cá nhân/học tập
3. **Performance**: Stream trực tiếp từ YouTube, không cache local
4. **Quality**: Có thể chọn quality cho audio/video

## Troubleshooting

### Lỗi: "Video unavailable"
- Video có thể bị private, deleted, hoặc geo-restricted
- Thử video khác

### Lỗi: "Cannot download"
- Kiểm tra internet connection
- Thử lại sau vài giây

### Lỗi: "Module not found"
- Chạy `npm install` để cài đặt dependencies

## License

MIT

