# Robot API - Endpoint cho Robot/ESP32

## Endpoint: `/stream_pcm`

Endpoint tương tự `youtube.kytuoi.com/stream_pcm` để robot có thể gọi trực tiếp.

### Cú pháp
```
GET /stream_pcm?song=<song_name>&artist=<artist_name>
```

### Parameters
- `song` (required): Tên bài hát
- `artist` (optional): Tên ca sĩ/nghệ sĩ

### Ví dụ

#### Chỉ có song
```
GET /stream_pcm?song=Lạc Trôi
```

#### Có cả song và artist
```
GET /stream_pcm?song=Lạc Trôi&artist=Đen Vâu
```

### Cách hoạt động

1. Nhận params `song` (và `artist` nếu có)
2. Tạo query: `song` hoặc `song artist`
3. Search YouTube với query đó
4. Lấy video đầu tiên từ kết quả
5. Stream MP3 về (tương tự `/api/stream/mp3`)

### Response

**Success**: MP3 audio stream
- Headers:
  - `Content-Type: audio/mpeg`
  - `Accept-Ranges: bytes`
  - `Access-Control-Allow-Origin: *`

**Error**: JSON error response
```json
{
  "success": false,
  "error": "Error message"
}
```

### Status Codes

- `200 OK`: Stream thành công
- `400 Bad Request`: Thiếu parameter `song`
- `404 Not Found`: Không tìm thấy video
- `500 Internal Server Error`: Lỗi server

## Ví dụ sử dụng

### ESP32/Robot
```cpp
// URL: http://192.168.1.5:6666/stream_pcm?song=Lạc Trôi&artist=Đen Vâu
String url = "http://192.168.1.5:6666/stream_pcm?song=" + urlEncode(songName) + "&artist=" + urlEncode(artistName);
httpClient.begin(url);
```

### cURL
```bash
# Test với song
curl "http://192.168.1.5:6666/stream_pcm?song=L%E1%BA%A1c%20Tr%C3%B4i" -o test.mp3

# Test với song và artist
curl "http://192.168.1.5:6666/stream_pcm?song=L%E1%BA%A1c%20Tr%C3%B4i&artist=%C4%90en%20V%C3%A2u" -o test.mp3
```

### JavaScript
```javascript
const song = 'Lạc Trôi';
const artist = 'Đen Vâu';
const url = `http://192.168.1.5:6666/stream_pcm?song=${encodeURIComponent(song)}&artist=${encodeURIComponent(artist)}`;

const audio = new Audio(url);
audio.play();
```

### HTML Audio Tag
```html
<audio controls>
    <source src="http://192.168.1.5:6666/stream_pcm?song=Lạc Trôi&artist=Đen Vâu" type="audio/mpeg">
</audio>
```

## So sánh với youtube.kytuoi.com

| Feature | youtube.kytuoi.com | Our API |
|---------|-------------------|---------|
| Endpoint | `/stream_pcm` | `/stream_pcm` ✅ |
| Params | `song`, `artist` | `song`, `artist` ✅ |
| Response | MP3 stream | MP3 stream ✅ |
| Search | YouTube | YouTube ✅ |
| Format | PCM/MP3 | MP3 ✅ |

## URL Encoding

Khi gọi từ ESP32/Robot, cần URL encode:

```cpp
// Ví dụ ESP32
String encodeURL(String str) {
    str.replace(" ", "%20");
    str.replace("à", "%C3%A0");
    str.replace("á", "%C3%A1");
    str.replace("ạ", "%E1%BA%A1");
    // ... các ký tự đặc biệt khác
    return str;
}

String url = "http://192.168.1.5:6666/stream_pcm?song=" + encodeURL("Lạc Trôi") + "&artist=" + encodeURL("Đen Vâu");
```

Hoặc dùng thư viện URL encoding có sẵn.

## Logs

Server sẽ log:
```
[YouTube API] Stream PCM request: song="Lạc Trôi", artist="Đen Vâu", query="Lạc Trôi Đen Vâu"
[YouTube API] Found video: Lạc Trôi - Đen Vâu (video_id)
[YouTube API] Streaming PCM: Lạc Trôi - Đen Vâu (video_id)
```

## Troubleshooting

### Lỗi 404: No results found
- Kiểm tra tên bài hát có đúng không
- Thử tìm trên YouTube trước
- Có thể video bị private/deleted

### Lỗi 400: Missing parameter
- Đảm bảo có parameter `song`
- `artist` là optional

### Stream bị gián đoạn
- Kiểm tra network connection
- Xem logs: `pm2 logs youtube-mp3-api`

## Test

```bash
# Test với curl
curl -I "http://192.168.1.5:6666/stream_pcm?song=L%E1%BA%A1c%20Tr%C3%B4i&artist=%C4%90en%20V%C3%A2u"

# Test stream
curl "http://192.168.1.5:6666/stream_pcm?song=L%E1%BA%A1c%20Tr%C3%B4i&artist=%C4%90en%20V%C3%A2u" -o test.mp3
```

## Cập nhật ESP32 Code

Thay đổi URL trong ESP32 code:

```cpp
// Cũ
String musicServer = "https://youtube.kytuoi.com";

// Mới
String musicServer = "http://192.168.1.5:6666";

// Endpoint giữ nguyên
String url = musicServer + "/stream_pcm?song=" + encodeURL(song) + "&artist=" + encodeURL(artist);
```







