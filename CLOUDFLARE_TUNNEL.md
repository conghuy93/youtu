# Hướng dẫn mở Cloudflare Tunnel

Hướng dẫn cấu hình Cloudflare Tunnel để truy cập YouTube MP3 API từ bất kỳ đâu qua internet.

## Lợi ích của Cloudflare Tunnel

✅ **Miễn phí** - Không tốn phí  
✅ **Bảo mật** - Không cần mở port trên router  
✅ **HTTPS tự động** - SSL/TLS miễn phí  
✅ **Truy cập toàn cầu** - Từ bất kỳ đâu có internet  
✅ **Domain miễn phí** - Subdomain `.trycloudflare.com`  

## Yêu cầu

- Server đang chạy trên port 6680
- Kết nối internet
- Tài khoản Cloudflare (miễn phí) - chỉ cần nếu muốn custom domain

---

## Cách 1: Quick Tunnel (Không cần tài khoản)

### Bước 1: Cài đặt cloudflared trên Raspberry Pi

```bash
# Download cloudflared cho ARM64 (Pi 5/4)
sudo wget -O /usr/local/bin/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64

# Cấp quyền thực thi
sudo chmod +x /usr/local/bin/cloudflared

# Kiểm tra
cloudflared --version
```

### Bước 2: Chạy Quick Tunnel

```bash
# Chạy tunnel (giữ terminal này mở)
cloudflared tunnel --url http://localhost:6680
```

**Kết quả:**
```
Your quick Tunnel has been created! Visit it at:
https://random-name-1234.trycloudflare.com
```

➡️ Copy URL này và truy cập từ bất kỳ đâu!

### Nhược điểm:
- URL thay đổi mỗi lần restart
- Không có tùy chỉnh
- Phải giữ terminal chạy

---

## Cách 2: Named Tunnel (Khuyến nghị - Cần tài khoản Cloudflare)

### Bước 1: Đăng ký tài khoản Cloudflare

1. Truy cập: https://dash.cloudflare.com/sign-up
2. Đăng ký miễn phí
3. (Optional) Thêm domain của bạn

### Bước 2: Cài đặt cloudflared

```bash
# Giống như Cách 1
sudo wget -O /usr/local/bin/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64
sudo chmod +x /usr/local/bin/cloudflared
```

### Bước 3: Login vào Cloudflare

```bash
cloudflared tunnel login
```

Sẽ hiển thị URL, mở trong browser và chọn domain/zone:
```
Please open the following URL and log in with your Cloudflare account:
https://dash.cloudflare.com/argotunnel?callback=...
```

### Bước 4: Tạo tunnel

```bash
# Tạo tunnel với tên "youtube-api"
cloudflared tunnel create youtube-api
```

Kết quả:
```
Tunnel credentials written to /home/huy123/.cloudflared/<TUNNEL-ID>.json
Created tunnel youtube-api with id <TUNNEL-ID>
```

**Lưu lại TUNNEL-ID!**

### Bước 5: Cấu hình tunnel

```bash
# Tạo file cấu hình
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

**Paste nội dung sau:**

```yaml
tunnel: <TUNNEL-ID>
credentials-file: /home/huy123/.cloudflared/<TUNNEL-ID>.json

ingress:
  - hostname: youtube-api.yourdomain.com
    service: http://localhost:6680
  - service: http_status:404
```

**Thay thế:**
- `<TUNNEL-ID>`: ID tunnel từ bước 4
- `youtube-api.yourdomain.com`: Subdomain bạn muốn
- `/home/huy123/`: Đường dẫn home thực tế

### Bước 6: Route DNS

```bash
# Link subdomain với tunnel
cloudflared tunnel route dns youtube-api youtube-api.yourdomain.com
```

### Bước 7: Chạy tunnel

```bash
cloudflared tunnel run youtube-api
```

✅ Truy cập: `https://youtube-api.yourdomain.com`

---

## Cách 3: Sử dụng subdomain Cloudflare miễn phí

Nếu không có domain riêng, dùng subdomain `.trycloudflare.com`:

### File config đơn giản hơn:

```yaml
tunnel: <TUNNEL-ID>
credentials-file: /home/huy123/.cloudflared/<TUNNEL-ID>.json

ingress:
  - service: http://localhost:6680
```

Chạy tunnel:
```bash
cloudflared tunnel run youtube-api
```

Tunnel sẽ tự tạo URL: `https://<tunnel-id>.cfargotunnel.com`

---

## Chạy tunnel tự động (Production)

### Option A: Systemd Service (Khuyến nghị)

```bash
# Cài đặt service
sudo cloudflared service install

# File config cần ở đúng vị trí
sudo mkdir -p /etc/cloudflared
sudo cp ~/.cloudflared/config.yml /etc/cloudflared/config.yml
sudo cp ~/.cloudflared/<TUNNEL-ID>.json /etc/cloudflared/

# Sửa config để đúng đường dẫn
sudo nano /etc/cloudflared/config.yml
```

**Config cho systemd:**
```yaml
tunnel: <TUNNEL-ID>
credentials-file: /etc/cloudflared/<TUNNEL-ID>.json

ingress:
  - hostname: youtube-api.yourdomain.com
    service: http://localhost:6680
  - service: http_status:404
```

```bash
# Enable và start service
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

# Kiểm tra status
sudo systemctl status cloudflared

# Xem logs
sudo journalctl -u cloudflared -f
```

### Option B: PM2 (Nếu đã dùng PM2)

```bash
# Tạo script wrapper
nano ~/start_tunnel.sh
```

**Nội dung:**
```bash
#!/bin/bash
cloudflared tunnel run youtube-api
```

```bash
# Cấp quyền
chmod +x ~/start_tunnel.sh

# Chạy với PM2
pm2 start ~/start_tunnel.sh --name cloudflare-tunnel
pm2 save
```

**Quản lý tunnel:**
```bash
pm2 status
pm2 logs cloudflare-tunnel
pm2 restart cloudflare-tunnel
pm2 stop cloudflare-tunnel
```

---

## Kiểm tra và Test

### 1. Kiểm tra tunnel đang chạy

```bash
# List tunnels
cloudflared tunnel list

# Info tunnel
cloudflared tunnel info youtube-api
```

### 2. Test từ internet

```bash
# Test health endpoint
curl https://youtube-api.yourdomain.com/health

# Test search
curl "https://youtube-api.yourdomain.com/api/search?q=test"
```

### 3. Test từ browser

Mở browser và truy cập:
```
https://youtube-api.yourdomain.com
```

---

## Tối ưu hóa

### 1. Logging

Thêm vào config.yml:
```yaml
loglevel: info
logfile: /var/log/cloudflared.log
```

### 2. Compression

Cloudflare tự động bật compression, không cần cấu hình.

### 3. Caching

Thêm headers trong server.js để cache static content:
```javascript
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        res.setHeader('Cache-Control', 'no-cache');
    } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    next();
});
```

### 4. Rate limiting qua Cloudflare

1. Dashboard Cloudflare → Security → WAF
2. Tạo rule rate limiting
3. Giới hạn: 100 requests/minute

---

## Bảo mật

### 1. Restrict access với Cloudflare Access (Optional)

```bash
# Cài đặt Cloudflare Access
# Dashboard → Zero Trust → Access → Applications
```

### 2. API Key authentication

Thêm vào server.js:
```javascript
const API_KEY = process.env.API_KEY || 'your-secret-key';

app.use('/api/*', (req, res, next) => {
    const key = req.headers['x-api-key'] || req.query.key;
    if (key !== API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
});
```

Truy cập với key:
```
https://youtube-api.yourdomain.com/api/search?q=test&key=your-secret-key
```

### 3. IP Whitelist (nếu cần)

Dashboard Cloudflare → Security → WAF → Tools → IP Access Rules

---

## Troubleshooting

### Lỗi: Cannot connect to tunnel

```bash
# Kiểm tra service
sudo systemctl status cloudflared

# Restart
sudo systemctl restart cloudflared

# Xem logs chi tiết
sudo journalctl -u cloudflared -n 100
```

### Lỗi: 502 Bad Gateway

➡️ Server localhost:6680 chưa chạy

```bash
# Kiểm tra server
curl http://localhost:6680/health

# Start server
pm2 start ecosystem.config.js
```

### Lỗi: DNS resolution failed

```bash
# Route lại DNS
cloudflared tunnel route dns youtube-api youtube-api.yourdomain.com
```

### Tunnel chạy nhưng không truy cập được

```bash
# Kiểm tra ingress rules
cloudflared tunnel info youtube-api

# Test local
curl http://localhost:6680/health

# Test tunnel
curl https://youtube-api.yourdomain.com/health
```

---

## Quản lý Tunnels

### List tất cả tunnels

```bash
cloudflared tunnel list
```

### Xóa tunnel

```bash
# Stop tunnel trước
sudo systemctl stop cloudflared

# Xóa
cloudflared tunnel delete youtube-api

# Cleanup route
cloudflared tunnel route dns --delete youtube-api youtube-api.yourdomain.com
```

### Đổi tên tunnel

```bash
# Không đổi được, phải tạo mới
cloudflared tunnel create youtube-api-new
# Cập nhật config.yml
# Re-route DNS
```

---

## So sánh các phương án

| Tính năng | Quick Tunnel | Named Tunnel | Port Forwarding |
|-----------|--------------|--------------|-----------------|
| **Giá** | Miễn phí | Miễn phí | Miễn phí |
| **Setup** | 1 phút | 10 phút | 5 phút |
| **HTTPS** | ✅ Tự động | ✅ Tự động | ❌ Cần setup |
| **Custom domain** | ❌ | ✅ | ✅ |
| **Ổn định** | ⚠️ URL thay đổi | ✅ | ✅ |
| **Bảo mật** | ✅ No port open | ✅ No port open | ⚠️ Port exposed |
| **Performance** | ✅ CDN Cloudflare | ✅ CDN Cloudflare | ⚠️ Direct |

**Khuyến nghị:** Named Tunnel với systemd

---

## Best Practices

1. ✅ Dùng systemd để auto-start
2. ✅ Monitor logs với journalctl
3. ✅ Thêm API key authentication
4. ✅ Enable Cloudflare caching cho static files
5. ✅ Backup file credentials JSON
6. ✅ Dùng custom domain (professional)
7. ✅ Setup rate limiting trên Cloudflare
8. ⚠️ Không commit credentials file lên Git!

---

## Ví dụ hoàn chỉnh

### 1. Cài đặt nhanh

```bash
# Install cloudflared
sudo wget -O /usr/local/bin/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64
sudo chmod +x /usr/local/bin/cloudflared

# Quick tunnel (test)
cloudflared tunnel --url http://localhost:6680
```

### 2. Production setup

```bash
# Login
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create youtube-api

# Config
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: YOUR-TUNNEL-ID
credentials-file: /home/huy123/.cloudflared/YOUR-TUNNEL-ID.json

ingress:
  - service: http://localhost:6680
EOF

# Run
cloudflared tunnel run youtube-api

# Install service
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

---

## Kết luận

Cloudflare Tunnel là giải pháp tốt nhất để expose local server ra internet:

✅ **Miễn phí hoàn toàn**  
✅ **Bảo mật cao** - Không mở port  
✅ **HTTPS tự động** - SSL miễn phí  
✅ **CDN toàn cầu** - Nhanh từ mọi nơi  
✅ **Dễ setup** - 5-10 phút  

**URL ví dụ:**
- Quick: `https://random-abc-123.trycloudflare.com`
- Named: `https://youtube-api.yourdomain.com`

---

## Hỗ trợ

- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [Cloudflared GitHub](https://github.com/cloudflare/cloudflared)

**Chúc bạn thành công! 🚀**
