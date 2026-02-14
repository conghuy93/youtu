# API Reference

## Base URL
```
http://localhost:6666
```

## Endpoints

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "YouTube MP3/MP4 API",
  "uptime": 3600
}
```

---

### GET /api/info
Get video information.

**Query Parameters:**
- `url` (string, optional): YouTube URL
- `id` (string, optional): Video ID

**Example:**
```
GET /api/info?id=dQw4w9WgXcQ
GET /api/info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "dQw4w9WgXcQ",
    "title": "Video Title",
    "description": "Video description...",
    "thumbnail": "https://i.ytimg.com/vi/...",
    "duration": 212,
    "durationFormatted": "3:32",
    "author": "Channel Name",
    "viewCount": "1234567",
    "uploadDate": "2023-01-01",
    "formats": [...]
  }
}
```

---

### GET /api/mp3
Download MP3 file.

**Query Parameters:**
- `url` (string, optional): YouTube URL
- `id` (string, optional): Video ID
- `quality` (string, optional): Audio quality (default: `highestaudio`)

**Example:**
```
GET /api/mp3?id=dQw4w9WgXcQ
GET /api/mp3?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&quality=highestaudio
```

**Response:** MP3 file (binary)

**Headers:**
- `Content-Type: audio/mpeg`
- `Content-Disposition: attachment; filename="song.mp3"`

---

### GET /api/mp4
Download MP4 file.

**Query Parameters:**
- `url` (string, optional): YouTube URL
- `id` (string, optional): Video ID
- `quality` (string, optional): Video quality (default: `highest`)

**Example:**
```
GET /api/mp4?id=dQw4w9WgXcQ
GET /api/mp4?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&quality=highest
```

**Response:** MP4 file (binary)

**Headers:**
- `Content-Type: video/mp4`
- `Content-Disposition: attachment; filename="video.mp4"`

---

### GET /api/stream/mp3
Stream MP3 audio (không download file).

**Query Parameters:**
- `url` (string, optional): YouTube URL
- `id` (string, optional): Video ID
- `quality` (string, optional): Audio quality (default: `highestaudio`)

**Example:**
```
GET /api/stream/mp3?id=dQw4w9WgXcQ
```

**Response:** MP3 audio stream

**Headers:**
- `Content-Type: audio/mpeg`
- `Accept-Ranges: bytes`

---

### GET /api/search
Search YouTube videos.

**Query Parameters:**
- `q` (string, required): Search query
- `limit` (number, optional): Number of results (default: 20, max: 50)

**Example:**
```
GET /api/search?q=never%20gonna%20give%20you%20up&limit=10
```

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
      "url": "https://www.youtube.com/watch?v=...",
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

---

### GET /stats
Get server statistics.

**Response:**
```json
{
  "uptime_seconds": 3600,
  "total_requests": 1234,
  "last_request_at": 1234567890,
  "per_endpoint": {
    "GET /api/info": 100,
    "GET /api/mp3": 50
  },
  "errors": 5,
  "downloads": {
    "mp3": 100,
    "mp4": 50
  },
  "memory_mb": {
    "rss": 128,
    "heap_used": 64,
    "heap_total": 96
  },
  "load_avg": [0.5, 0.6, 0.7],
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

---

## Error Responses

All endpoints may return error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

**HTTP Status Codes:**
- `400`: Bad Request (missing/invalid parameters)
- `404`: Not Found (invalid endpoint)
- `500`: Internal Server Error

---

## Quality Options

### Audio Quality (MP3)
- `highestaudio`: Highest quality audio (default)
- `lowestaudio`: Lowest quality audio
- `highest`: Highest quality (may include video)

### Video Quality (MP4)
- `highest`: Highest quality (default)
- `lowest`: Lowest quality
- `highestvideo`: Highest video quality
- `lowestvideo`: Lowest video quality

---

## Rate Limiting

⚠️ **Note**: YouTube may rate limit requests if too many requests are made. Use responsibly.

---

## Examples

### cURL
```bash
# Get info
curl "http://localhost:6666/api/info?id=dQw4w9WgXcQ"

# Download MP3
curl "http://localhost:6666/api/mp3?id=dQw4w9WgXcQ" -o song.mp3

# Search
curl "http://localhost:6666/api/search?q=music&limit=10"
```

### JavaScript
```javascript
const axios = require('axios');

// Get info
const info = await axios.get('http://localhost:6666/api/info?id=dQw4w9WgXcQ');

// Download MP3
const mp3 = await axios.get('http://localhost:6666/api/mp3?id=dQw4w9WgXcQ', {
  responseType: 'stream'
});
```

### PHP
```php
// Get info
$info = json_decode(file_get_contents('http://localhost:6666/api/info?id=dQw4w9WgXcQ'), true);

// Download MP3
$mp3 = file_get_contents('http://localhost:6666/api/mp3?id=dQw4w9WgXcQ');
file_put_contents('song.mp3', $mp3);
```







