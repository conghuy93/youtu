# Hướng dẫn cập nhật yt-dlp

## ✅ Cách 1: Cập nhật yt-dlp bản mới nhất (Khuyến nghị)

yt-dlp cập nhật rất nhanh, thường sửa lỗi trong vài ngày.

### Trên Linux/Server:

```bash
# Cập nhật yt-dlp
pip3 install -U yt-dlp

# Hoặc nếu dùng pip
pip install -U yt-dlp

# Kiểm tra version
yt-dlp --version
```

### Nếu dùng npm package:

```bash
cd /root/youtube_mp3_api
npm install yt-dlp-exec@latest
```

### Khởi động lại server:

```bash
pm2 restart youtube-mp3-api
pm2 logs youtube-mp3-api
```

## ✅ Cách 2: Kiểm tra và cài đặt ffmpeg (Cần cho MP3 conversion)

```bash
# Kiểm tra ffmpeg
ffmpeg -version

# Cài đặt ffmpeg (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install ffmpeg

# Cài đặt ffmpeg (CentOS/RHEL)
sudo yum install ffmpeg

# Cài đặt ffmpeg (macOS)
brew install ffmpeg
```

## ✅ Các cải tiến đã được áp dụng trong code:

1. **Thêm compat-options**: `--compat-options no-direct-merge` để tránh SABR streaming
2. **Thêm User-Agent**: Đầy đủ User-Agent để tránh bot detection
3. **Fallback mechanism**: Thử nhiều clients (web, tv_embedded, mweb, ios, android)
4. **SABR detection**: Tự động phát hiện và báo lỗi cho SABR videos
5. **Multiple format options**: Thử nhiều format để tăng khả năng thành công

## ⚠️ Lưu ý về SABR videos:

Một số video YouTube được bảo vệ bởi SABR (Server-Assisted Bitrate Reduction) và **KHÔNG THỂ** tải được bằng các công cụ hiện tại.

Server sẽ tự động:
- Phát hiện SABR videos
- Trả về error message rõ ràng
- Thử nhiều clients và formats trước khi báo lỗi

## 🔍 Kiểm tra logs:

```bash
# Xem logs real-time
pm2 logs youtube-mp3-api --lines 50

# Xem logs lỗi
pm2 logs youtube-mp3-api --err --lines 100
```

## 📝 Test server:

```bash
# Test health check
curl http://localhost:6666/health

# Test stream_pcm
curl "http://localhost:6666/stream_pcm?song=test&artist=test"

# Test stream MP3
curl "http://localhost:6666/api/stream/mp3?id=dQw4w9WgXcQ"
```





