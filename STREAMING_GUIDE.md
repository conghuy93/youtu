# Streaming Guide - Hướng dẫn sử dụng Stream MP3

## Vấn đề: Stream MP3 không hoạt động trong browser

### Nguyên nhân
- Browser cần HTTP Range support để seek/play audio
- Thiếu CORS headers
- Headers không đúng format

### Giải pháp
Đã cập nhật endpoint `/api/stream/mp3` với:
- ✅ HTTP Range support (206 Partial Content)
- ✅ CORS headers đầy đủ
- ✅ Cache headers
- ✅ Keep-alive connection

## Cách sử dụng

### 1. Trong HTML Audio Tag
```html
<audio controls>
    <source src="http://192.168.1.5:6666/api/stream/mp3?id=dQw4w9WgXcQ" type="audio/mpeg">
    Your browser does not support the audio element.
</audio>
```

### 2. Trong JavaScript
```javascript
const audio = new Audio('http://192.168.1.5:6666/api/stream/mp3?id=dQw4w9WgXcQ');
audio.play();
```

### 3. Trong React/Vue
```jsx
// React
<audio controls src={`http://192.168.1.5:6666/api/stream/mp3?id=${videoId}`} />

// Vue
<audio controls :src="`http://192.168.1.5:6666/api/stream/mp3?id=${videoId}`" />
```

### 4. Test với curl
```bash
# Test stream (sẽ stream liên tục)
curl "http://192.168.1.5:6666/api/stream/mp3?id=dQw4w9WgXcQ" --output stream.mp3

# Test với range request (seek support)
curl -H "Range: bytes=0-1023" "http://192.168.1.5:6666/api/stream/mp3?id=dQw4w9WgXcQ"
```

## So sánh: Download vs Stream

### Download MP3 (`/api/mp3`)
- **Mục đích**: Tải file về máy
- **Headers**: `Content-Disposition: attachment`
- **Sử dụng**: Download file, lưu trữ local
- **Ví dụ**: 
  ```bash
  curl "http://192.168.1.5:6666/api/mp3?id=dQw4w9WgXcQ" -o song.mp3
  ```

### Stream MP3 (`/api/stream/mp3`)
- **Mục đích**: Phát trực tiếp, không download
- **Headers**: `Content-Type: audio/mpeg`, `Accept-Ranges: bytes`
- **Sử dụng**: Play trong browser, audio player, mobile app
- **Ví dụ**:
  ```html
  <audio src="http://192.168.1.5:6666/api/stream/mp3?id=dQw4w9WgXcQ" controls></audio>
  ```

## Troubleshooting

### Browser không play được
1. **Kiểm tra CORS**: Mở DevTools → Network → Xem có CORS error không
2. **Kiểm tra headers**: Response phải có `Content-Type: audio/mpeg`
3. **Test với curl**: `curl -I "http://192.168.1.5:6666/api/stream/mp3?id=dQw4w9WgXcQ"`

### Không thể seek (jump to position)
- Cần HTTP Range support (206 Partial Content)
- Đã được implement trong code mới

### Stream bị gián đoạn
- Kiểm tra network connection
- Kiểm tra YouTube video có available không
- Xem logs: `pm2 logs youtube-mp3-api`

## Test Endpoints

### 1. Health Check
```bash
curl http://192.168.1.5:6666/health
```

### 2. Get Video Info
```bash
curl "http://192.168.1.5:6666/api/info?id=dQw4w9WgXcQ"
```

### 3. Download MP3
```bash
curl "http://192.168.1.5:6666/api/mp3?id=dQw4w9WgXcQ" -o song.mp3
```

### 4. Stream MP3 (test headers)
```bash
curl -I "http://192.168.1.5:6666/api/stream/mp3?id=dQw4w9WgXcQ"
```

### 5. Stream MP3 (test range)
```bash
curl -H "Range: bytes=0-1023" "http://192.168.1.5:6666/api/stream/mp3?id=dQw4w9WgXcQ" -o test.mp3
```

## Best Practices

1. **Sử dụng Stream cho playback**: Dùng `/api/stream/mp3` khi muốn play trong browser/app
2. **Sử dụng Download cho storage**: Dùng `/api/mp3` khi muốn lưu file
3. **Cache video info**: Cache video info để tránh request nhiều lần
4. **Error handling**: Luôn handle errors khi stream

## Example: Full HTML Page

```html
<!DOCTYPE html>
<html>
<head>
    <title>YouTube MP3 Stream Test</title>
</head>
<body>
    <h1>YouTube MP3 Stream</h1>
    
    <audio controls>
        <source src="http://192.168.1.5:6666/api/stream/mp3?id=dQw4w9WgXcQ" type="audio/mpeg">
        Your browser does not support the audio element.
    </audio>
    
    <script>
        // Test stream với JavaScript
        const audio = new Audio('http://192.168.1.5:6666/api/stream/mp3?id=dQw4w9WgXcQ');
        
        audio.addEventListener('loadedmetadata', () => {
            console.log('Audio loaded:', audio.duration, 'seconds');
        });
        
        audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
        });
    </script>
</body>
</html>
```







