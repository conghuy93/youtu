# Tích hợp với ESP32 Music Player

## ✅ Đã tối ưu cho ESP32

Server đã được cấu hình để tương thích 100% với ESP32 music player tại:
`D:\OTTO\xiaozhi-esp321hoanthanh3-toiuuram-1132`

## 🔄 Flow hoạt động:

### 1. ESP32 Request:
```
GET /stream_pcm?song=SongName&artist=ArtistName
```

### 2. Server Response (JSON):
```json
{
  "success": true,
  "id": "VIDEO_ID",
  "title": "Song Name",
  "artist": "Artist Name",
  "audio_url": "/api/stream/mp3?id=VIDEO_ID",
  "url": "/api/stream/mp3?id=VIDEO_ID",
  "lyric_url": null,
  "thumbnail": "https://...",
  "duration": 240,
  "bitrate": "highestaudio",
  "source": "youtube"
}
```

### 3. ESP32 Parse và Build URL:
- ESP32 parse JSON để lấy `audio_url`
- Build full URL: `base_url + audio_url`
- Ví dụ: `http://192.168.1.5:6666/api/stream/mp3?id=VIDEO_ID`

### 4. ESP32 Stream MP3:
```
GET /api/stream/mp3?id=VIDEO_ID
```

### 5. Server Stream MP3 (qua ffmpeg):
- ytdl-core stream webm/opus từ YouTube
- ffmpeg convert real-time sang MP3
- ESP32 nhận MP3 stream

## 🎵 Format Conversion:

```
YouTube (webm/opus) 
  → ytdl-core stream 
  → ffmpeg convert 
  → MP3 stream 
  → ESP32
```

## ⚙️ Cấu hình:

### 1. ESP32 Settings:
- `music_srv`: `http://YOUR_SERVER_IP:6666`
- Ví dụ: `http://192.168.1.5:6666`

### 2. Server Requirements:
- Node.js với @distube/ytdl-core
- ffmpeg (để convert sang MP3)
- Không cần yt-dlp

## 🔧 FFmpeg Settings:

- **Format**: MP3
- **Encoder**: libmp3lame
- **Bitrate**: 192kbps
- **Sample rate**: 44.1kHz
- **Channels**: Stereo (2)

## 📊 So sánh:

| Feature | Code cũ | Code mới |
|---------|---------|----------|
| getInfo | Không dùng requestOptions | ✅ Không dùng requestOptions |
| Stream | Không dùng requestOptions | ✅ Không dùng requestOptions |
| Format | webm/opus | ✅ MP3 (qua ffmpeg) |
| ESP32 compatibility | Cần decoder webm/opus | ✅ MP3 native |

## ✅ Đã sửa:

1. **Bỏ requestOptions**: Giống code cũ - tránh lỗi 410
2. **Dùng ffmpeg**: Convert webm/opus sang MP3 cho ESP32
3. **Format response**: Đúng format ESP32 cần
4. **audio_url**: Không có format parameter - tự động dùng ffmpeg

## 🚀 Khởi động:

```bash
# Đảm bảo ffmpeg đã cài
ffmpeg -version

# Khởi động server
pm2 restart youtube-mp3-api
pm2 logs youtube-mp3-api
```

## 🔍 Test:

### 1. Test stream_pcm:
```bash
curl "http://localhost:6666/stream_pcm?song=test&artist=test"
```

### 2. Test stream MP3:
```bash
curl "http://localhost:6666/api/stream/mp3?id=dQw4w9WgXcQ" -o test.mp3
file test.mp3
# Kết quả: MP3 audio file
```

### 3. Test với ESP32:
1. Set `music_srv` trong ESP32 settings
2. Yêu cầu phát nhạc qua voice hoặc button
3. ESP32 sẽ tự động request và stream MP3

## ⚠️ Lưu ý:

1. **FFmpeg required**: Cần cài ffmpeg để convert sang MP3
2. **CPU usage**: ffmpeg conversion tốn CPU
3. **Fallback**: Nếu ffmpeg không có, sẽ stream webm/opus (ESP32 cần decoder)

## 📝 Logs:

```bash
# Xem logs real-time
pm2 logs youtube-mp3-api --lines 50

# Tìm logs ESP32
pm2 logs youtube-mp3-api | grep "ESP32"
pm2 logs youtube-mp3-api | grep "ffmpeg"
```

## 🎯 Kết quả:

- ✅ ESP32 nhận MP3 thực sự (không cần decoder webm/opus)
- ✅ Tương thích 100% với ESP32 music player
- ✅ Không còn lỗi 410 (đã bỏ requestOptions)
- ✅ Stream ổn định với ffmpeg conversion





