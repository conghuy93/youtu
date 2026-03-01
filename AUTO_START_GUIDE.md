# Hướng dẫn Tự động khởi động Server và Tunnel

Hướng dẫn cấu hình server và Cloudflare Tunnel tự động chạy khi Raspberry Pi khởi động lại.

---

## ✅ Setup Auto-start cho Server (PM2)

### Bước 1: Cài đặt PM2 (nếu chưa có)

```bash
sudo npm install -g pm2
```

### Bước 2: Start server với PM2

```bash
cd ~/youtube_mp3_api
pm2 start ecosystem.config.js
```

### Bước 3: Cấu hình PM2 auto-start

```bash
# Tạo startup script
pm2 startup

# PM2 sẽ hiển thị một lệnh, copy và chạy nó
# Ví dụ lệnh sẽ giống như:
# sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u huy123 --hp /home/huy123
```

**Copy và chạy lệnh mà PM2 hiển thị!**

### Bước 4: Lưu danh sách process

```bash
pm2 save
```

### Bước 5: Kiểm tra

```bash
# Xem status
pm2 status

# Test reboot
sudo reboot

# Sau khi Pi khởi động lại, kiểm tra
pm2 status
curl http://localhost:6680/health
```

---

## ✅ Setup Auto-start cho Cloudflare Tunnel

### Tunnel đã được cài đặt service, chỉ cần enable:

```bash
# Kiểm tra status
sudo systemctl status cloudflared

# Enable auto-start (nếu chưa)
sudo systemctl enable cloudflared

# Restart để test
sudo systemctl restart cloudflared
```

### Kiểm tra tunnel auto-start:

```bash
# Xem có enabled không
sudo systemctl is-enabled cloudflared

# Kết quả phải là: enabled
```

---

## 🧪 Test Auto-start

### Test 1: Soft reboot

```bash
sudo reboot
```

Sau khi Pi khởi động lại, SSH vào và kiểm tra:

```bash
# Kiểm tra server
pm2 status
curl http://localhost:6680/health

# Kiểm tra tunnel
sudo systemctl status cloudflared
curl https://api.minizjp.com/health
```

### Test 2: Hard reboot

1. Tắt nguồn Pi
2. Đợi 10 giây
3. Bật nguồn lại
4. Đợi Pi boot xong (~30 giây)
5. Kiểm tra như trên

---

## 📋 Các lệnh quản lý

### PM2 (Server):

```bash
# Xem status
pm2 status

# Xem logs
pm2 logs youtube-mp3-api

# Xem logs real-time
pm2 logs youtube-mp3-api --lines 100 -f

# Restart
pm2 restart youtube-mp3-api

# Stop
pm2 stop youtube-mp3-api

# Start lại
pm2 start youtube-mp3-api

# Xóa khỏi PM2
pm2 delete youtube-mp3-api

# Monitor resource
pm2 monit

# Lưu lại config
pm2 save

# Xem startup config
pm2 startup
```

### Systemd (Cloudflare Tunnel):

```bash
# Status
sudo systemctl status cloudflared

# Start
sudo systemctl start cloudflared

# Stop
sudo systemctl stop cloudflared

# Restart
sudo systemctl restart cloudflared

# Enable auto-start
sudo systemctl enable cloudflared

# Disable auto-start
sudo systemctl disable cloudflared

# Xem logs
sudo journalctl -u cloudflared -f

# Xem logs từ boot
sudo journalctl -u cloudflared -b

# Xem 100 dòng logs cuối
sudo journalctl -u cloudflared -n 100
```

---

## 🔧 Troubleshooting

### Server không tự động chạy

```bash
# Kiểm tra PM2 startup script
pm2 startup

# Re-save processes
pm2 save

# Xem PM2 logs
pm2 logs

# Manual start
cd ~/youtube_mp3_api
pm2 start ecosystem.config.js
pm2 save
```

### Tunnel không tự động chạy

```bash
# Kiểm tra service enabled
sudo systemctl is-enabled cloudflared

# Nếu disabled, enable lại
sudo systemctl enable cloudflared

# Kiểm tra config
sudo cat /etc/cloudflared/config.yml

# Kiểm tra credentials file
ls -la /etc/cloudflared/*.json

# Check logs để xem lỗi
sudo journalctl -u cloudflared -n 50
```

### Server chạy nhưng không truy cập được

```bash
# Kiểm tra port
sudo netstat -tulpn | grep 6680

# Kiểm tra process
ps aux | grep node

# Test local
curl http://localhost:6680/health

# Xem logs
pm2 logs youtube-mp3-api
```

### Tunnel chạy nhưng không kết nối được Cloudflare

```bash
# Kiểm tra internet
ping 1.1.1.1

# Kiểm tra DNS
nslookup api.minizjp.com

# Restart tunnel
sudo systemctl restart cloudflared

# Xem logs chi tiết
sudo journalctl -u cloudflared -f
```

---

## ✅ Checklist sau khi Setup

- [ ] PM2 server chạy: `pm2 status`
- [ ] PM2 startup enabled: `pm2 startup` (đã chạy lệnh output)
- [ ] PM2 saved: `pm2 save`
- [ ] Cloudflare service enabled: `sudo systemctl is-enabled cloudflared`
- [ ] Server local OK: `curl http://localhost:6680/health`
- [ ] Tunnel OK: `curl https://api.minizjp.com/health`
- [ ] Test reboot: `sudo reboot` và kiểm tra lại tất cả

---

## 🎯 Quick Commands

### Kiểm tra tất cả services:

```bash
# One-liner check all
echo "=== PM2 Status ===" && pm2 status && \
echo "=== Cloudflare Status ===" && sudo systemctl status cloudflared --no-pager && \
echo "=== Server Health ===" && curl http://localhost:6680/health && \
echo "=== Tunnel Health ===" && curl https://api.minizjp.com/health
```

### Restart tất cả:

```bash
# Restart both server and tunnel
pm2 restart youtube-mp3-api && sudo systemctl restart cloudflared
```

### View all logs:

```bash
# Terminal 1: PM2 logs
pm2 logs youtube-mp3-api -f

# Terminal 2: Cloudflare logs
sudo journalctl -u cloudflared -f
```

---

## 📊 Monitoring

### Tạo script kiểm tra tự động:

```bash
nano ~/check_services.sh
```

**Paste vào:**

```bash
#!/bin/bash

echo "=========================================="
echo "Service Health Check - $(date)"
echo "=========================================="

# Check PM2
echo -e "\n[PM2 Status]"
pm2 status | grep youtube-mp3-api

# Check Cloudflare
echo -e "\n[Cloudflare Status]"
sudo systemctl status cloudflared --no-pager | grep Active

# Check Server
echo -e "\n[Server Health]"
curl -s http://localhost:6680/health || echo "❌ Server not responding"

# Check Tunnel
echo -e "\n[Tunnel Health]"
curl -s https://api.minizjp.com/health || echo "❌ Tunnel not responding"

echo -e "\n=========================================="
```

```bash
# Cấp quyền
chmod +x ~/check_services.sh

# Chạy
~/check_services.sh
```

### Tạo cron job kiểm tra định kỳ (optional):

```bash
crontab -e
```

**Thêm dòng (kiểm tra mỗi 5 phút):**

```bash
*/5 * * * * /home/huy123/check_services.sh >> /home/huy123/service_check.log 2>&1
```

---

## 🚀 Best Practices

1. ✅ **Luôn dùng PM2** cho Node.js apps
2. ✅ **Enable systemd** cho system services (cloudflared)
3. ✅ **Test reboot** sau khi setup
4. ✅ **Monitor logs** định kỳ
5. ✅ **Backup configs** trước khi thay đổi
6. ✅ **Document changes** để sau này nhớ

---

## 📦 Backup Auto-start Config

### Backup PM2 config:

```bash
# Export PM2 config
pm2 save
pm2 startup

# Backup file
cp ~/.pm2/dump.pm2 ~/backup_pm2_$(date +%Y%m%d).pm2
```

### Backup Cloudflare config:

```bash
# Backup configs
sudo cp /etc/cloudflared/config.yml ~/backup_cf_config_$(date +%Y%m%d).yml
sudo cp /etc/cloudflared/*.json ~/backup_cf_creds_$(date +%Y%m%d).json

# Change ownership
sudo chown huy123:huy123 ~/backup_cf_*.yml ~/backup_cf_*.json
```

---

## 🔄 Restore Auto-start (nếu cần)

### Restore PM2:

```bash
cd ~/youtube_mp3_api
pm2 start ecosystem.config.js
pm2 startup
# Chạy lệnh mà PM2 output
pm2 save
```

### Restore Cloudflare:

```bash
# Copy configs về
sudo cp ~/backup_cf_config_*.yml /etc/cloudflared/config.yml
sudo cp ~/backup_cf_creds_*.json /etc/cloudflared/

# Re-enable service
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

---

## ✅ Kết luận

Sau khi setup xong:

✅ **Server tự động chạy** khi Pi khởi động  
✅ **Tunnel tự động chạy** khi Pi khởi động  
✅ **Auto-restart** nếu service crash  
✅ **24/7 uptime** cho API  

**API sẵn sàng production! 🎉**

---

## Hỗ trợ

- PM2 docs: https://pm2.keymetrics.io/docs/usage/startup/
- Systemd docs: https://www.freedesktop.org/software/systemd/man/systemctl.html
- Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

**Chúc bạn thành công! 🚀**
