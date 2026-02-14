# Structure Comparison - So sánh với nodejs_proxy (ZingMP3)

## Cấu trúc tương tự

Hệ thống YouTube MP3 API được xây dựng tương tự như `nodejs_proxy` (ZingMP3) để AI có thể sử dụng dễ dàng.

## So sánh Endpoints

| ZingMP3 Proxy | YouTube API | Mô tả |
|--------------|------------|-------|
| `/api/search?q=...` | `/api/search?q=...` | Tìm kiếm |
| `/api/info-song?id=...` | `/api/info?id=...` | Thông tin bài hát/video |
| `/api/song?id=...` | `/api/mp3?id=...` | Download MP3 |
| `/api/song/stream?id=...` | `/api/stream/mp3?id=...` | Stream MP3 |
| `/api/lyric?id=...` | `/api/lyric?id=...` | Lời bài hát |
| `/stream_pcm?song=...&artist=...` | `/stream_pcm?song=...&artist=...` | **Tương tự** - Trả về JSON |

## Response Structure - `/stream_pcm`

### ZingMP3 Proxy Response
```json
{
  "success": true,
  "id": "Z7O9AZFU",
  "title": "Lạc Trôi",
  "artist": "Sơn Tùng M-TP",
  "bitrate": "128",
  "audio_url": "/api/song/stream?id=Z7O9AZFU",
  "url": "/api/song/stream?id=Z7O9AZFU",
  "lyric_url": "/api/lyric?id=Z7O9AZFU",
  "thumbnail": "https://photo-resize-zmp3.zmdcdn.me/...",
  "duration": 240,
  "source": "zingmp3"
}
```

### YouTube API Response
```json
{
  "success": true,
  "id": "dQw4w9WgXcQ",
  "title": "Lạc Trôi",
  "artist": "Đen Vâu",
  "bitrate": "highestaudio",
  "audio_url": "/api/stream/mp3?id=dQw4w9WgXcQ",
  "url": "/api/stream/mp3?id=dQw4w9WgXcQ",
  "lyric_url": "/api/lyric?id=dQw4w9WgXcQ",
  "thumbnail": "https://i.ytimg.com/vi/...",
  "duration": 240,
  "source": "youtube"
}
```

## Fields Mapping

| Field | ZingMP3 | YouTube | Notes |
|-------|---------|---------|-------|
| `success` | ✅ | ✅ | Boolean |
| `id` | ✅ | ✅ | Song/Video ID |
| `title` | ✅ | ✅ | Tên bài hát |
| `artist` | ✅ | ✅ | Tên nghệ sĩ |
| `audio_url` | ✅ | ✅ | Relative path |
| `url` | ✅ | ✅ | Alias cho audio_url |
| `lyric_url` | ✅ | ✅ | Có thể null |
| `thumbnail` | ✅ | ✅ | URL ảnh |
| `duration` | ✅ | ✅ | Giây |
| `bitrate` | ✅ | ✅ | "128"/"320" vs "highestaudio" |
| `source` | ✅ | ✅ | "zingmp3" vs "youtube" |

## Cấu trúc thư mục

### ZingMP3 Proxy
```
nodejs_proxy/
├── server.js              # Main server
├── mp3_api_index.js       # ZingMP3 API client
├── package.json
├── README.md
└── ...
```

### YouTube API
```
youtube_mp3_api/
├── server.js              # Main server (tương tự)
├── package.json
├── README.md
├── ESP32_COMPATIBILITY.md
├── ROBOT_API.md
└── ...
```

## Logic Flow

### ZingMP3 Proxy
```
Request: /stream_pcm?song=...&artist=...
  ↓
Search ZingMP3: /api/v2/search/multi
  ↓
Get first result
  ↓
Get song info: /api/v2/song/get/info
  ↓
Get stream URL: /api/v2/song/get/streaming
  ↓
Return JSON: { audio_url: "/api/song/stream?id=..." }
```

### YouTube API
```
Request: /stream_pcm?song=...&artist=...
  ↓
Search YouTube: youtube-sr.search()
  ↓
Get first result
  ↓
Get video info: ytdl.getInfo()
  ↓
Build stream URL: /api/stream/mp3?id=...
  ↓
Return JSON: { audio_url: "/api/stream/mp3?id=..." }
```

## AI/ESP32 Usage

Cả hai API đều tương thích với ESP32/AI vì:

1. **Cùng response format**: JSON với các field giống nhau
2. **Cùng audio_url format**: Relative path
3. **Cùng parsing logic**: ESP32 parse các field giống nhau
4. **Cùng error handling**: `success: false` với `error` message

## Code Example (AI/ESP32)

```cpp
// Works với cả ZingMP3 và YouTube API
cJSON* response = cJSON_Parse(json_string);
cJSON* success = cJSON_GetObjectItem(response, "success");
cJSON* audio_url = cJSON_GetObjectItem(response, "audio_url");
cJSON* title = cJSON_GetObjectItem(response, "title");
cJSON* artist = cJSON_GetObjectItem(response, "artist");

if (cJSON_IsTrue(success) && audio_url) {
    std::string full_url = base_url + audio_url->valuestring;
    StartStreaming(full_url);
}
```

## Differences

| Aspect | ZingMP3 | YouTube |
|--------|---------|---------|
| Search | ZingMP3 API | YouTube Search |
| Stream | Direct MP3 URL | ytdl-core stream |
| Lyrics | ZingMP3 API | YouTube Captions |
| Bitrate | Fixed (128/320) | Variable (highestaudio) |
| Source | "zingmp3" | "youtube" |

## Migration

Để chuyển từ ZingMP3 sang YouTube:

1. **Change base URL**:
   ```cpp
   // Cũ
   String base_url = "http://192.168.1.5:5555";
   
   // Mới
   String base_url = "http://192.168.1.5:6666";
   ```

2. **Endpoints giữ nguyên**:
   - `/stream_pcm?song=...&artist=...` ✅
   - Response format giống nhau ✅

3. **ESP32 code không cần thay đổi** (nếu parse đúng)

## Conclusion

✅ **Cấu trúc tương tự 100%**
✅ **Response format giống nhau**
✅ **ESP32/AI có thể dùng cả hai**
✅ **Dễ migrate giữa hai API**







