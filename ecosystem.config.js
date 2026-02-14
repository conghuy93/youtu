/**
 * PM2 Ecosystem Configuration
 * YouTube MP3/MP4 API Server
 */

module.exports = {
  apps: [{
    name: 'youtube-mp3-api',
    script: './server.js',
    instances: 1, // Số instances (có thể dùng 'max' để dùng tất cả CPU cores)
    exec_mode: 'fork', // 'fork' hoặc 'cluster'
    watch: false, // Tự động restart khi file thay đổi (dev mode)
    max_memory_restart: '500M', // Restart nếu memory vượt quá 500MB
    env: {
      NODE_ENV: 'production',
      PORT: 6666
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 6666,
      watch: true
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true, // Tự động restart khi crash
    max_restarts: 5, // Số lần restart tối đa (giảm xuống để tránh loop)
    min_uptime: '5s', // Thời gian tối thiểu để coi là chạy thành công
    restart_delay: 5000, // Delay trước khi restart (ms) - tăng lên để có thời gian fix
    // Advanced options
    kill_timeout: 5000, // Thời gian chờ trước khi force kill
    listen_timeout: 10000, // Thời gian chờ app listen (tăng lên 10s)
    shutdown_with_message: true,
    wait_ready: true, // Chờ signal 'ready' từ app
    // Logging
    log_type: 'raw', // 'json' hoặc 'raw' (đổi sang raw để dễ đọc)
    // Health check
    health_check_grace_period: 5000
  }]
};

