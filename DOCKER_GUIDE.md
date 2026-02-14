# Docker Guide - YouTube MP3/MP4 API

## Yêu cầu
- Docker Desktop đã cài đặt
- Docker Compose (thường đi kèm Docker Desktop)

## Cách sử dụng

### 1. Build và chạy với Docker Compose (Khuyến nghị)

```bash
# Build và chạy container
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng container
docker-compose down
```

### 2. Build và chạy với Docker thuần

```bash
# Build image
docker build -t youtube-mp3-api .

# Chạy container
docker run -d \
  --name youtube-mp3-api \
  -p 6680:6680 \
  -v $(pwd)/cache:/app/cache \
  --restart unless-stopped \
  youtube-mp3-api

# Xem logs
docker logs -f youtube-mp3-api

# Dừng container
docker stop youtube-mp3-api
docker rm youtube-mp3-api
```

### 3. Truy cập API

Sau khi container chạy, truy cập:

| URL | Mô tả |
|-----|-------|
| http://localhost:6680 | Web UI |
| http://localhost:6680/health | Health check |
| http://localhost:6680/api/search?q=... | Tìm kiếm |
| http://localhost:6680/api/stream/mp3?id=... | Stream nhạc |

### 4. Các lệnh hữu ích

```bash
# Xem trạng thái container
docker-compose ps

# Restart container
docker-compose restart

# Rebuild image (khi có thay đổi code)
docker-compose up -d --build

# Xem resource usage
docker stats youtube-mp3-api

# Vào shell container
docker exec -it youtube-mp3-api sh
```

### 5. Deploy lên server

```bash
# Copy files lên server
scp -r . user@server:/path/to/app

# SSH vào server
ssh user@server

# Chạy container
cd /path/to/app
docker-compose up -d
```

### 6. Cấu hình môi trường

Tạo file `.env` để override các biến môi trường:

```env
PORT=6680
NODE_ENV=production
```

Sau đó cập nhật `docker-compose.yml`:

```yaml
services:
  youtube-mp3-api:
    env_file:
      - .env
```

## Troubleshooting

### Container không start
```bash
docker-compose logs youtube-mp3-api
```

### yt-dlp lỗi
```bash
# Vào container và update yt-dlp
docker exec -it youtube-mp3-api sh
pip3 install --upgrade yt-dlp
```

### Port bị chiếm
Đổi port trong `docker-compose.yml`:
```yaml
ports:
  - "8080:6680"  # Đổi 6680 thành 8080
```
