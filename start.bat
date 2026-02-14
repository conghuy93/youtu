@echo off
REM Start script với PM2 cho Windows

echo === Starting YouTube MP3 API with PM2 ===

REM Kiểm tra PM2 đã cài chưa
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo PM2 chưa được cài đặt!
    echo Đang cài đặt PM2...
    npm install -g pm2
)

REM Kiểm tra node_modules
if not exist "node_modules" (
    echo Đang cài đặt dependencies...
    npm install
)

REM Tạo thư mục logs nếu chưa có
if not exist "logs" mkdir logs

REM Start với PM2
echo Starting server...
pm2 start ecosystem.config.js

REM Hiển thị status
pm2 status

echo.
echo ✅ Server đã được start!
echo.
echo Các lệnh hữu ích:
echo   pm2 logs youtube-mp3-api    - Xem logs
echo   pm2 monit                   - Monitor
echo   pm2 restart youtube-mp3-api - Restart
echo   pm2 stop youtube-mp3-api     - Stop
echo.

pause







