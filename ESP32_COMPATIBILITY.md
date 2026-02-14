# ESP32 Compatibility - Tương thích với ESP32/AI

## Response Structure

Endpoint `/stream_pcm` trả về JSON response tương tự ZingMP3 proxy để ESP32/AI có thể parse.

### Success Response

```json
{
  "success": true,
  "id": "dQw4w9WgXcQ",
  "title": "Lạc Trôi",
  "artist": "Đen Vâu",
  "audio_url": "/api/stream/mp3?id=dQw4w9WgXcQ",
  "url": "/api/stream/mp3?id=dQw4w9WgXcQ",
  "lyric_url": "/api/lyric?id=dQw4w9WgXcQ",
  "thumbnail": "https://i.ytimg.com/vi/...",
  "duration": 240,
  "bitrate": "highestaudio",
  "source": "youtube"
}
```

### Error Response

```json
{
  "success": false,
  "error": "No results found for: Lạc Trôi"
}
```

## Fields Mapping

| Field | Type | Required | Description | ESP32 Usage |
|-------|------|----------|-------------|-------------|
| `success` | boolean | ✅ | Trạng thái thành công | Check trước khi parse |
| `title` | string | ✅ | Tên bài hát | Hiển thị |
| `artist` | string | ✅ | Tên nghệ sĩ | Hiển thị |
| `audio_url` | string | ✅ | URL để stream MP3 | **Dùng để play** |
| `url` | string | ✅ | Alias cho audio_url | Có thể dùng thay audio_url |
| `lyric_url` | string/null | ⚠️ | URL để lấy lyrics | Optional, có thể null |
| `id` | string | ✅ | Video ID | Debug/logging |
| `bitrate` | string | ✅ | Chất lượng audio | Info only |
| `thumbnail` | string | ✅ | URL ảnh bài hát | Info only |
| `duration` | number | ✅ | Thời lượng (giây) | Info only |
| `source` | string | ✅ | Nguồn ("youtube") | Info only |
| `error` | string | ❌ | Thông báo lỗi | Khi success=false |

## ESP32 Parsing Code

```cpp
// Parse JSON response
cJSON* response_json = cJSON_Parse(last_downloaded_data_.c_str());

// Check success
cJSON* success = cJSON_GetObjectItem(response_json, "success");
if (!success || !cJSON_IsTrue(success)) {
    // Error handling
    cJSON* error = cJSON_GetObjectItem(response_json, "error");
    // Log error message
    return;
}

// Extract required fields
cJSON* artist = cJSON_GetObjectItem(response_json, "artist");
cJSON* title = cJSON_GetObjectItem(response_json, "title");
cJSON* audio_url = cJSON_GetObjectItem(response_json, "audio_url");
cJSON* lyric_url = cJSON_GetObjectItem(response_json, "lyric_url");

// Build full URL
std::string base_url = "http://192.168.1.5:6666";
std::string audio_path = audio_url->valuestring;
std::string full_url = base_url + audio_path;

// Start streaming
StartStreaming(full_url);
```

## URL Building

ESP32 cần build full URL từ `audio_url`:

```
Base URL: http://192.168.1.5:6666
audio_url: /api/stream/mp3?id=dQw4w9WgXcQ
Full URL: http://192.168.1.5:6666/api/stream/mp3?id=dQw4w9WgXcQ
```

## So sánh với ZingMP3

| Feature | ZingMP3 Proxy | YouTube API | Status |
|---------|---------------|-------------|--------|
| Response format | JSON | JSON | ✅ |
| Fields | success, title, artist, audio_url, lyric_url | success, title, artist, audio_url, lyric_url | ✅ |
| audio_url format | Relative path | Relative path | ✅ |
| Stream endpoint | `/api/song/stream?id=...` | `/api/stream/mp3?id=...` | ✅ |
| Lyrics | `/api/lyric?id=...` | `/api/lyric?id=...` | ✅ |
| Search | `/api/search?q=...` | `/api/search?q=...` | ✅ |

## Test với ESP32

### Request
```
GET http://192.168.1.5:6666/stream_pcm?song=Lạc Trôi&artist=Đen Vâu
```

### Response
```json
{
  "success": true,
  "id": "dQw4w9WgXcQ",
  "title": "Lạc Trôi",
  "artist": "Đen Vâu",
  "audio_url": "/api/stream/mp3?id=dQw4w9WgXcQ",
  "url": "/api/stream/mp3?id=dQw4w9WgXcQ",
  "lyric_url": "/api/lyric?id=dQw4w9WgXcQ",
  "thumbnail": "https://...",
  "duration": 240,
  "bitrate": "highestaudio",
  "source": "youtube"
}
```

### ESP32 sẽ:
1. Parse JSON
2. Extract `audio_url`
3. Build full URL: `http://192.168.1.5:6666/api/stream/mp3?id=dQw4w9WgXcQ`
4. Start streaming từ URL đó

## Endpoints Summary

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/stream_pcm?song=...&artist=...` | GET | Search và trả về JSON | JSON với audio_url |
| `/api/stream/mp3?id=...` | GET | Stream MP3 audio | MP3 stream |
| `/api/lyric?id=...` | GET | Get lyrics/captions | JSON với lyrics info |
| `/api/search?q=...` | GET | Search videos | JSON array |
| `/api/info?id=...` | GET | Get video info | JSON với metadata |

## Compatibility Checklist

- [x] JSON response format
- [x] `success` field
- [x] `title` field
- [x] `artist` field
- [x] `audio_url` field (relative path)
- [x] `url` field (alias)
- [x] `lyric_url` field (optional)
- [x] `id` field
- [x] `bitrate` field
- [x] `thumbnail` field
- [x] `duration` field
- [x] `source` field
- [x] Error handling với `error` field

## Notes

1. **audio_url là relative path**: ESP32 cần build full URL
2. **lyric_url có thể null**: Không phải video nào cũng có captions
3. **bitrate**: YouTube không có bitrate cố định như ZingMP3, dùng "highestaudio"
4. **source**: "youtube" để phân biệt với "zingmp3"







