# Server chỉ dùng ytdl-core (không dùng yt-dlp)

## ✅ Đã cập nhật

Server hiện tại **CHỈ DÙNG ytdl-core**, không còn dùng yt-dlp fallback.

## 🔧 Các thay đổi chính:

### 1. **Tắt yt-dlp fallback**
- Không còn gọi `getYtDlpInfo()` khi ytdl-core thất bại
- Không còn gọi `getYtDlpDirectUrl()` trong `selectAudioFormat()`
- Không còn dùng `streamMp3FromYtDlp()` để convert MP3

### 2. **Cải thiện ytdl-core**
- Thêm **retry mechanism**: Thử tối đa 3 lần khi getInfo thất bại
- Thêm **headers đầy đủ**: User-Agent, Accept, Accept-Language, Referer
- Cải thiện **error handling**: Log rõ ràng hơn

### 3. **Format output**
- ytdl-core stream **webm/opus** format (không phải MP3)
- ESP32 cần decoder hỗ trợ webm/opus hoặc convert ở client side

## ⚠️ Lưu ý quan trọng:

### 1. **Format audio**
- ytdl-core chỉ stream được **webm/opus**, không phải MP3
- ESP32 cần decoder hỗ trợ webm/opus
- Hoặc cần convert webm → MP3 ở client side

### 2. **Tỷ lệ thành công**
- Một số video YouTube có thể không tải được do:
  - YouTube thay đổi API
  - Video bị hạn chế
  - Signature extraction thất bại

### 3. **Cập nhật ytdl-core**
Để tăng tỷ lệ thành công, cập nhật ytdl-core thường xuyên:

```bash
cd /root/youtube_mp3_api
npm install @distube/ytdl-core@latest
# hoặc
npm install ytdl-core@latest

pm2 restart youtube-mp3-api
```

## 📊 So sánh:

| Feature | ytdl-core only | ytdl-core + yt-dlp |
|---------|----------------|-------------------|
| Dependencies | Chỉ cần Node.js | Cần Node.js + yt-dlp + ffmpeg |
| Format output | webm/opus | MP3 (nếu dùng yt-dlp) |
| Tỷ lệ thành công | ~70-80% | ~90-95% |
| Tốc độ | Nhanh | Chậm hơn (do convert) |
| Phức tạp | Đơn giản | Phức tạp hơn |

## 🔍 Kiểm tra logs:

```bash
# Xem logs
pm2 logs youtube-mp3-api --lines 50

# Kiểm tra retry
grep "attempt" logs/pm2-out.log
```

## 🚀 Khởi động lại:

```bash
pm2 restart youtube-mp3-api
pm2 logs youtube-mp3-api
```

## 💡 Nếu gặp lỗi "Could not extract functions":

1. **Cập nhật ytdl-core**:
   ```bash
   npm install @distube/ytdl-core@latest
   ```

2. **Kiểm tra version**:
   ```bash
   npm list @distube/ytdl-core
   ```

3. **Restart server**:
   ```bash
   pm2 restart youtube-mp3-api
   ```

## 📝 Test:

```bash
# Test health
curl http://localhost:6666/health

# Test stream_pcm
curl "http://localhost:6666/stream_pcm?song=test&artist=test"

# Test stream audio
curl "http://localhost:6666/api/stream/mp3?id=dQw4w9WgXcQ"
```





