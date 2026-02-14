# Hướng dẫn chi tiết từng bước - Raspberry Pi 5

Hướng dẫn này chia rõ từng bước làm trên **MÁY TÍNH WINDOWS** và trên **RASPBERRY PI 5**.

---

## 📋 CHUẨN BỊ

### Cần có:
- ✅ Raspberry Pi 5 (hoặc Pi 4)
- ✅ Thẻ nhớ SD đã cài Raspberry Pi OS
- ✅ Nguồn điện Pi (USB-C 5V/3A)
- ✅ Kết nối internet cho Pi (Ethernet hoặc WiFi)
- ✅ Máy tính Windows để chuẩn bị
- ✅ Cùng mạng LAN với Pi (để transfer file)

---

## PHẦN 1: TRÊN MÁY TÍNH WINDOWS 💻

### Bước 1.1: Chuẩn bị code

**Mở PowerShell/Terminal trên Windows:**

```powershell
# Di chuyển đến thư mục code
cd "f:\code\youtube_mp3_api - Copy (5)\youtube_mp3_api - Copy (5)"

# Xem danh sách file
dir
```

### Bước 1.2: Xóa các file không cần thiết (Tuỳ chọn)

**Trên Windows - PowerShell:**

```powershell
# Xóa node_modules (sẽ cài lại trên Pi)
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# Xóa package-lock.json
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Xóa cache
Remove-Item -Recurse -Force cache -ErrorAction SilentlyContinue
```

**Lý do:** File này từ Windows, cần build lại trên Linux (Pi).

### Bước 1.3: Nén thư mục (Option A - Dễ nhất)

**Trên Windows - File Explorer:**

1. Chuột phải vào thư mục `youtube_mp3_api - Copy (5)`
2. Chọn **"Send to" → "Compressed (zipped) folder"**
3. Đặt tên: `youtube_mp3_api.zip`
4. Copy file zip vào USB

**Hoặc dùng PowerShell:**

```powershell
# Nén thư mục
Compress-Archive -Path "f:\code\youtube_mp3_api - Copy (5)\youtube_mp3_api - Copy (5)" -DestinationPath "f:\youtube_mp3_api.zip"
```

### Bước 1.4: Transfer file sang Pi

**OPTION A: Dùng USB (Đơn giản nhất)**

1. Copy file `youtube_mp3_api.zip` vào USB
2. Rút USB và cắm vào Pi
3. Chuyển sang **PHẦN 2**

**OPTION B: Dùng SCP (Cần biết IP của Pi)**

**Trước tiên, tìm IP của Pi:**

Trên Pi, mở terminal và chạy:
```bash
hostname -I
```
Ghi lại IP, ví dụ: `192.168.1.100`

**Quay lại Windows - PowerShell:**

```powershell
# Cài đặt OpenSSH Client (nếu chưa có)
# Vào Settings → Apps → Optional Features → Add "OpenSSH Client"

# Transfer file bằng SCP
scp -r "f:\code\youtube_mp3_api - Copy (5)\youtube_mp3_api - Copy (5)" pi@192.168.1.100:~/youtube_mp3_api

# Nhập password của Pi khi được yêu cầu (mặc định: raspberry)
```

**OPTION C: Dùng WinSCP (GUI - Dễ sử dụng)**

1. **Download WinSCP:** https://winscp.net/eng/download.php
2. **Cài đặt và mở WinSCP**
3. **Kết nối:**
   - File protocol: `SCP`
   - Host name: `192.168.1.100` (IP của Pi)
   - Port: `22`
   - User name: `pi`
   - Password: `raspberry` (hoặc password bạn đã đặt)
4. **Click "Login"**
5. **Kéo thả thư mục** từ Windows (bên trái) sang Pi (bên phải)
6. Đợi upload hoàn tất (5-10 phút)

---

## PHẦN 2: TRÊN RASPBERRY PI 5 🥧

### Bước 2.1: Kết nối Pi

**Cách 1: Dùng màn hình + bàn phím trực tiếp**
- Cắm màn hình HDMI, bàn phím USB vào Pi
- Mở Terminal

**Cách 2: SSH từ Windows (Không cần màn hình)**

**Trên Windows - PowerShell:**

```powershell
# Kết nối SSH
ssh pi@192.168.1.100

# Nhập password: raspberry (hoặc của bạn)
```

**Bây giờ bạn đang ở Terminal của Pi! 🎉**

### Bước 2.2: Cập nhật hệ thống Pi

**Chạy trên Pi Terminal:**

```bash
# Cập nhật danh sách packages
sudo apt update

# Nâng cấp hệ thống (mất 5-10 phút)
sudo apt upgrade -y
```

<Đợi hoàn tất...>

### Bước 2.3: Cài đặt Node.js

**Chạy trên Pi:**

```bash
# Download và cài đặt Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Cài đặt Node.js và npm
sudo apt install -y nodejs

# Kiểm tra cài đặt thành công
node -v
# Kết quả: v20.x.x

npm -v
# Kết quả: 10.x.x
```

**Thời gian:** ~3-5 phút

### Bước 2.4: Cài đặt FFmpeg

**Chạy trên Pi:**

```bash
# Cài đặt FFmpeg
sudo apt install -y ffmpeg

# Kiểm tra
ffmpeg -version
# Nên hiện ra version và build info
```

**Thời gian:** ~2 phút

### Bước 2.5: Copy code từ USB (nếu dùng USB)

**Chạy trên Pi:**

```bash
# Tạo thư mục mount point
sudo mkdir -p /mnt/usb

# Xem thiết bị USB
lsblk
# Tìm USB, thường là /dev/sda1 hoặc /dev/sdb1

# Mount USB
sudo mount /dev/sda1 /mnt/usb

# Kiểm tra file
ls /mnt/usb

# Copy file zip vào home
cp /mnt/usb/youtube_mp3_api.zip ~/

# Giải nén
cd ~
unzip youtube_mp3_api.zip

# Đổi tên nếu cần
mv "youtube_mp3_api - Copy (5)" youtube_mp3_api

# Unmount USB
sudo umount /mnt/usb
```

**HOẶC nếu đã dùng SCP/WinSCP:**

Code đã có sẵn trong `~/youtube_mp3_api`, bỏ qua bước này.

### Bước 2.6: Di chuyển vào thư mục project

**Chạy trên Pi:**

```bash
# Di chuyển vào thư mục
cd ~/youtube_mp3_api

# Xem danh sách file
ls -la

# Kiểm tra file quan trọng có đủ không
ls server.js package.json
```

Nếu thấy cả 2 file → OK ✅

### Bước 2.7: Dọn dẹp và cài đặt dependencies

**Chạy trên Pi:**

```bash
# Xóa node_modules cũ (nếu có từ Windows)
rm -rf node_modules

# Xóa package-lock.json
rm -f package-lock.json

# Xóa cache
rm -rf cache

# Clear npm cache
npm cache clean --force

# Cài đặt dependencies (MẤT 5-10 PHÚT)
npm install
```

<Đợi cài đặt... màn hình sẽ hiện nhiều dòng>

**Nếu gặp lỗi, thử:**

```bash
npm install --legacy-peer-deps
```

### Bước 2.8: Test cài đặt

**Chạy trên Pi:**

```bash
# Test xem các module đã load được chưa
node test_imports.js
```

**Kết quả mong đợi:**

```
[Test] Testing imports...
✓ express loaded
✓ cors loaded
✓ axios loaded
✓ @distube/ytdl-core loaded
✓ youtube-sr loaded
✓ fluent-ffmpeg loaded
All imports successful!
```

Nếu thấy đầy đủ ✓ → **THÀNH CÔNG!** 🎉

### Bước 2.9: Chạy server (Lần đầu - Test)

**Chạy trên Pi:**

```bash
# Chạy server
npm start
```

**Hoặc:**

```bash
node server.js
```

**Kết quả mong đợi:**

```
[YouTube API] Starting server on port 6680...
[YouTube API] Node version: v20.x.x
[YouTube API] Environment: development
[YouTube API] Testing imports...
[YouTube API] All imports OK
[YouTube API] Server running at http://0.0.0.0:6680
[YouTube API] Server ready! 🚀
```

**Server đang chạy!** 🚀

### Bước 2.10: Test server

**MỞ TAB MỚI trên Pi Terminal (Ctrl+Shift+T):**

```bash
# Test health endpoint
curl http://localhost:6680/health
```

**Kết quả:**

```json
{
  "status": "ok",
  "uptime": 10.5,
  "message": "YouTube MP3 API is running"
}
```

**Test search:**

```bash
curl "http://localhost:6680/api/search?q=test"
```

Nếu thấy JSON trả về → **HOẠT ĐỘNG TỐT!** ✅

---

## PHẦN 3: TEST TỪ MÁY WINDOWS 💻

### Bước 3.1: Lấy IP của Pi

**Trên Pi Terminal:**

```bash
hostname -I
```

Ghi lại IP, ví dụ: `192.168.1.100`

### Bước 3.2: Test từ Windows

**Mở Browser trên Windows, truy cập:**

```
http://192.168.1.100:6680
```

**Nếu thấy giao diện web →** Server đang hoạt động trên Pi! 🎉

**Test API:**

```
http://192.168.1.100:6680/health
http://192.168.1.100:6680/api/search?q=test
```

---

## PHẦN 4: CHẠY SERVER LÂU DÀI (Production) 🥧

### Bước 4.1: Cài đặt PM2 (Trên Pi)

**Chạy trên Pi:**

```bash
# Cài đặt PM2 globally
sudo npm install -g pm2
```

**Thời gian:** ~2 phút

### Bước 4.2: Start server với PM2

**Chạy trên Pi:**

```bash
# Di chuyển vào thư mục (nếu chưa ở đó)
cd ~/youtube_mp3_api

# Start với PM2
pm2 start ecosystem.config.js
```

**Hoặc:**

```bash
npm run pm2:start
```

**Kết quả:**

```
[PM2] Starting server.js in fork_mode (1 instance)
[PM2] Done.
┌────┬────────────────┬─────────┬─────────┬──────────┐
│ id │ name           │ mode    │ status  │ cpu      │
└────┴────────────────┴─────────┴─────────┴──────────┘
│ 0  │ youtube-mp3-api│ fork    │ online  │ 0%       │
└────┴────────────────┴─────────┴─────────┴──────────┘
```

### Bước 4.3: Xem logs

**Chạy trên Pi:**

```bash
# Xem logs real-time
pm2 logs youtube-mp3-api

# Nhấn Ctrl+C để thoát
```

### Bước 4.4: Cấu hình tự động chạy khi reboot

**Chạy trên Pi:**

```bash
# Tạo startup script
pm2 startup

# PM2 sẽ hiện một dòng lệnh bắt đầu bằng "sudo..."
# COPY và CHẠY dòng lệnh đó
```

**Ví dụ dòng lệnh:**

```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u pi --hp /home/pi
```

**Sau đó lưu:**

```bash
pm2 save
```

**✅ Xong! Giờ server sẽ tự chạy mỗi khi Pi khởi động lại.**

### Bước 4.5: Test reboot

**Chạy trên Pi:**

```bash
# Reboot Pi
sudo reboot
```

<Đợi Pi khởi động lại ~30 giây>

**Kết nối SSH lại từ Windows:**

```powershell
ssh pi@192.168.1.100
```

**Kiểm tra PM2:**

```bash
pm2 status
```

Nếu thấy `online` → **THÀNH CÔNG!** 🎉

---

## 📊 QUẢN LÝ SERVER

### Các lệnh PM2 hữu ích (Trên Pi)

```bash
# Xem status
pm2 status

# Xem logs
pm2 logs youtube-mp3-api

# Xem logs 100 dòng cuối
pm2 logs youtube-mp3-api --lines 100

# Xem monitoring (CPU, RAM)
pm2 monit

# Restart server
pm2 restart youtube-mp3-api

# Stop server
pm2 stop youtube-mp3-api

# Start lại
pm2 start youtube-mp3-api

# Xóa khỏi PM2
pm2 delete youtube-mp3-api
```

### Monitor từ Windows

**Mở browser trên Windows:**

```
http://192.168.1.100:6680/metrics
```

Xem thống kê requests, errors, uptime...

---

## 🔧 TROUBLESHOOTING

### Vấn đề: Không kết nối SSH được

**Trên Pi (cần màn hình):**

```bash
# Enable SSH
sudo raspi-config
# Chọn: Interface Options → SSH → Enable
```

### Vấn đề: Không truy cập được từ Windows

**Trên Pi:**

```bash
# Kiểm tra IP
hostname -I

# Kiểm tra server đang chạy
pm2 status
# hoặc
curl http://localhost:6680/health
```

**Trên Windows:**

```powershell
# Ping Pi
ping 192.168.1.100

# Nếu ping được nhưng vào web không được → check firewall
```

**Trên Pi - Tắt firewall (test):**

```bash
sudo ufw disable
```

### Vấn đề: npm install lỗi

**Trên Pi:**

```bash
# Xóa và thử lại
cd ~/youtube_mp3_api
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
```

### Vấn đề: Server chậm

**Trên Pi:**

```bash
# Kiểm tra RAM
free -h

# Kiểm tra CPU
top

# Nhấn 'q' để thoát
```

**Nếu RAM < 500MB còn trống:**

```bash
# Tạo swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Tự động mount
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Vấn đề: Port 6680 đã được dùng

**Trên Pi:**

```bash
# Tìm process đang dùng port
sudo lsof -i :6680

# Kill process
sudo kill -9 <PID>

# Hoặc dùng PM2 restart
pm2 restart youtube-mp3-api
```

---

## 📝 TÓM TẮT NHANH

### Trên WINDOWS:
1. ✅ Nén code thành zip
2. ✅ Copy vào USB hoặc dùng SCP/WinSCP

### Trên PI:
1. ✅ `sudo apt update && sudo apt upgrade -y`
2. ✅ Cài Node.js: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs`
3. ✅ Cài FFmpeg: `sudo apt install -y ffmpeg`
4. ✅ Copy code từ USB hoặc đã có từ SCP
5. ✅ `cd ~/youtube_mp3_api`
6. ✅ `rm -rf node_modules && npm install`
7. ✅ Test: `node test_imports.js`
8. ✅ Chạy: `npm start` (test) hoặc `pm2 start ecosystem.config.js` (production)
9. ✅ Tự động: `pm2 startup && pm2 save`

### Test từ WINDOWS:
- ✅ Browser: `http://<pi-ip>:6680`

---

## 🎯 CHECKLIST HOÀN THÀNH

- [ ] Pi đã cài OS và kết nối mạng
- [ ] Đã cài Node.js 20.x trên Pi
- [ ] Đã cài FFmpeg trên Pi
- [ ] Code đã copy vào Pi
- [ ] `npm install` thành công
- [ ] `test_imports.js` chạy OK
- [ ] Server chạy được với `npm start`
- [ ] Test từ Windows thành công
- [ ] PM2 cài đặt và chạy OK
- [ ] PM2 startup đã cấu hình
- [ ] Server tự chạy sau reboot

**✅ Tất cả check → HOÀN THÀNH!** 🎉

---

**Thời gian tổng:** ~30-45 phút (tùy tốc độ mạng)

**Chúc bạn thành công!** 🚀
