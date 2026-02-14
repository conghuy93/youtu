# Hướng dẫn cài đặt và sử dụng ffmpeg

## ✅ Đã tích hợp ffmpeg vào server

Server hiện tại sử dụng **ytdl-core + ffmpeg** để convert webm/opus sang MP3 real-time cho ESP32.

## 🔧 Cài đặt ffmpeg

### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install ffmpeg

# Kiểm tra version
ffmpeg -version
```

### CentOS/RHEL:
```bash
sudo yum install ffmpeg

# Hoặc với dnf (CentOS 8+)
sudo dnf install ffmpeg
```

### macOS:
```bash
brew install ffmpeg
```

### Windows:
1. Tải ffmpeg từ: https://ffmpeg.org/download.html
2. Giải nén và thêm vào PATH
3. Hoặc set `FFMPEG_PATH` environment variable

## ⚙️ Cấu hình

### Environment Variable (Optional):
```bash
# Nếu ffmpeg không ở PATH, set đường dẫn
export FFMPEG_PATH=/usr/bin/ffmpeg

# Hoặc trong ecosystem.config.js
env: {
    FFMPEG_PATH: '/usr/bin/ffmpeg'
}
```

## 🎵 Format conversion

### Flow:
1. **ytdl-core** stream webm/opus từ YouTube
2. **ffmpeg** convert real-time sang MP3
3. **ESP32** nhận MP3 stream

### FFmpeg settings:
- **Format**: MP3
- **Encoder**: libmp3lame
- **Bitrate**: 192kbps
- **Sample rate**: 44.1kHz
- **Channels**: Stereo (2)

### Có thể điều chỉnh trong code:
```javascript
const ffmpegArgs = [
    '-i', '-',
    '-f', 'mp3',
    '-acodec', 'libmp3lame',
    '-ab', '192k',      // Bitrate (có thể thay đổi: 128k, 192k, 256k, 320k)
    '-ar', '44100',     // Sample rate (có thể thay đổi: 22050, 44100, 48000)
    '-ac', '2',         // Channels (1 = mono, 2 = stereo)
    '-'
];
```

## 🔍 Kiểm tra

### 1. Kiểm tra ffmpeg có sẵn:
```bash
which ffmpeg
ffmpeg -version
```

### 2. Test conversion:
```bash
# Test convert file
ffmpeg -i input.webm -f mp3 -acodec libmp3lame -ab 192k output.mp3
```

### 3. Test server:
```bash
# Test stream MP3
curl "http://localhost:6666/api/stream/mp3?id=dQw4w9WgXcQ" -o test.mp3

# Kiểm tra file
file test.mp3
# Kết quả: test.mp3: Audio file with ID3 version 2.3.0, contains: MPEG ADTS, layer III, v1, 192 kbps, 44.1 kHz, Stereo
```

## 📊 So sánh

| Feature | Không có ffmpeg | Có ffmpeg |
|---------|----------------|-----------|
| Format output | webm/opus | MP3 |
| ESP32 compatibility | Cần decoder webm/opus | Hỗ trợ MP3 native |
| CPU usage | Thấp | Trung bình (do conversion) |
| Latency | Thấp | Cao hơn một chút (do conversion) |
| Dependencies | Chỉ Node.js | Node.js + ffmpeg |

## ⚠️ Lưu ý

### 1. **CPU Usage**
- ffmpeg conversion tốn CPU
- Nên monitor CPU usage khi có nhiều requests đồng thời

### 2. **Memory**
- ffmpeg process tốn memory
- Nên có đủ RAM cho nhiều conversions đồng thời

### 3. **Fallback**
- Nếu ffmpeg không có hoặc lỗi, server sẽ fallback về stream webm/opus trực tiếp
- ESP32 cần decoder hỗ trợ webm/opus trong trường hợp này

## 🚀 Khởi động lại server

```bash
pm2 restart youtube-mp3-api
pm2 logs youtube-mp3-api
```

## 🔍 Debug

### Xem logs:
```bash
# Xem logs real-time
pm2 logs youtube-mp3-api --lines 50

# Tìm lỗi ffmpeg
pm2 logs youtube-mp3-api | grep ffmpeg
```

### Lỗi thường gặp:

1. **"ffmpeg not found"**:
   ```bash
   # Cài đặt ffmpeg
   sudo apt-get install ffmpeg
   ```

2. **"libmp3lame not found"**:
   ```bash
   # Cài đặt libmp3lame
   sudo apt-get install libmp3lame-dev
   ```

3. **"Permission denied"**:
   ```bash
   # Kiểm tra quyền
   ls -l $(which ffmpeg)
   ```

## 📝 Test với ESP32

1. ESP32 request: `/api/stream/mp3?id=VIDEO_ID`
2. Server stream MP3 qua ffmpeg
3. ESP32 nhận và phát MP3

## 💡 Tối ưu

### Giảm CPU usage:
- Giảm bitrate: `-ab 128k` (thay vì 192k)
- Giảm sample rate: `-ar 22050` (thay vì 44100)
- Mono: `-ac 1` (thay vì stereo)

### Tăng chất lượng:
- Tăng bitrate: `-ab 256k` hoặc `320k`
- Giữ sample rate: `-ar 44100`
- Stereo: `-ac 2`





