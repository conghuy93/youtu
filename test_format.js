/**
 * Test script để kiểm tra format audio (M4A/AAC hay WebM/Opus)
 * Usage: node test_format.js [videoId]
 */

const http = require('http');

const VIDEO_ID = process.argv[2] || 'ZpPBozhojuo';
const BASE_URL = 'http://localhost:6666';

console.log('==========================================');
console.log(`Testing Audio Format for Video: ${VIDEO_ID}`);
console.log('==========================================\n');

// Test 1: Check format endpoint
async function testCheckFormat() {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}/api/check-format?id=${VIDEO_ID}`;
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log('1. Format Check Result:');
                    console.log('----------------------------------------');
                    console.log(JSON.stringify(json, null, 2));
                    if (json.isAAC) {
                        console.log('✅ Format: M4A (AAC) - ĐÚNG!');
                    } else {
                        console.log('❌ Format: KHÔNG PHẢI M4A (AAC)');
                    }
                    console.log('');
                    resolve(json);
                } catch (e) {
                    console.error('Error parsing response:', e.message);
                    console.log('Raw response:', data);
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Test 2: Check Content-Type header
async function testContentType() {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}/api/stream/mp3?id=${VIDEO_ID}`;
        http.get(url, (res) => {
            const contentType = res.headers['content-type'] || '';
            console.log('2. Content-Type Header:');
            console.log('----------------------------------------');
            console.log(`Content-Type: ${contentType}`);
            
            if (contentType.includes('audio/mp4')) {
                console.log('✅ Format: M4A (AAC) - ĐÚNG!');
            } else if (contentType.includes('audio/webm')) {
                console.log('❌ Format: WebM (Opus) - KHÔNG PHẢI M4A');
            } else {
                console.log(`⚠️  Format: Unknown (${contentType})`);
            }
            console.log('');
            
            // Đóng connection ngay (không cần download data)
            res.destroy();
            resolve(contentType);
        }).on('error', reject);
    });
}

// Test 3: Check video info formats
async function testVideoInfo() {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}/api/info?id=${VIDEO_ID}`;
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log('3. Available Audio Formats:');
                    console.log('----------------------------------------');
                    if (json.success && json.data && json.data.formats) {
                        const audioFormats = json.data.formats
                            .filter(f => f.hasAudio && !f.hasVideo)
                            .slice(0, 5);
                        
                        audioFormats.forEach(f => {
                            const isM4A = f.mimeType && f.mimeType.includes('audio/mp4');
                            const marker = isM4A ? '✅' : '  ';
                            console.log(`${marker} itag=${f.itag}, ${f.mimeType || 'unknown'}, container=${f.container || 'unknown'}`);
                        });
                        
                        const hasM4A = audioFormats.some(f => f.mimeType && f.mimeType.includes('audio/mp4'));
                        if (hasM4A) {
                            console.log('\n✅ M4A format có sẵn trong video');
                        } else {
                            console.log('\n❌ Không tìm thấy M4A format trong video');
                        }
                    }
                    console.log('');
                    resolve(json);
                } catch (e) {
                    console.error('Error parsing response:', e.message);
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Run all tests
async function runTests() {
    try {
        await testCheckFormat();
        await testContentType();
        await testVideoInfo();
        
        console.log('==========================================');
        console.log('Test completed!');
        console.log('==========================================');
    } catch (error) {
        console.error('Test failed:', error.message);
        process.exit(1);
    }
}

runTests();





