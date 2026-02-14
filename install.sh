#!/bin/bash
# Script cài đặt dependencies cho YouTube MP3 API

echo "=== Installing YouTube MP3 API Dependencies ==="
echo ""

# Kiểm tra Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js 16+ first"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo "✓ npm version: $(npm --version)"
echo ""

# Xóa node_modules cũ nếu có
if [ -d "node_modules" ]; then
    echo "Removing old node_modules..."
    rm -rf node_modules
fi

# Xóa package-lock.json nếu có
if [ -f "package-lock.json" ]; then
    echo "Removing old package-lock.json..."
    rm -f package-lock.json
fi

# Clear npm cache
echo "Clearing npm cache..."
npm cache clean --force

# Cài đặt dependencies
echo ""
echo "Installing dependencies (this may take a few minutes)..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Installation completed successfully!"
    echo ""
    
    # Kiểm tra các module quan trọng
    echo "Verifying critical modules..."
    node -e "
        try {
            require('express');
            require('cors');
            require('@distube/ytdl-core');
            require('youtube-sr');
            console.log('✅ All critical modules OK');
        } catch (e) {
            console.log('❌ Module error:', e.message);
            process.exit(1);
        }
    "
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ All dependencies verified!"
        echo ""
        echo "You can now start the server with:"
        echo "  npm start"
        echo "  or"
        echo "  pm2 start ecosystem.config.js"
    else
        echo ""
        echo "⚠️  Some modules may not be installed correctly"
        echo "Try: npm install --force"
    fi
else
    echo ""
    echo "❌ Installation failed!"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check internet connection"
    echo "2. Try: npm install --force"
    echo "3. Try: npm install --legacy-peer-deps"
    exit 1
fi







