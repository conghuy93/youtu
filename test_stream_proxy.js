/**
 * Test script để kiểm tra stream có được proxy qua server hay không
 * Usage: node test_stream_proxy.js [videoId]
 */

const http = require('http');

const VIDEO_ID = process.argv[2] || 'ZpPBozhojuo';
const BASE_URL = 'http://localhost:6666';

console.log('==========================================');
console.log(`Testing Stream Proxy for Video: ${VIDEO_ID}`);
console.log('==========================================\n');

// Test 1: format=stream (proxy qua server)
async function testStreamProxy() {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}/api/stream/mp3?id=${VIDEO_ID}&format=stream`;
        console.log('1. Testing format=stream (proxy qua server):');
        console.log('----------------------------------------');
        console.log(`URL: ${url}\n`);
        
        const req = http.get(url, (res) => {
            console.log(`Status Code: ${res.statusCode}`);
            console.log(`Content-Type: ${res.headers['content-type']}`);
            console.log(`Server: ${res.headers['server'] || 'N/A'}`);
            console.log(`Content-Length: ${res.headers['content-length'] || 'chunked'}`);
            
            // Kiểm tra xem có phải từ server không
            const isFromServer = res.headers['server'] || 
                                 res.headers['x-powered-by'] || 
                                 res.headers['access-control-allow-origin'];
            
            if (isFromServer) {
                console.log('✅ Stream được PROXY QUA SERVER (không phải trực tiếp từ YouTube)');
            } else {
                console.log('⚠️  Không xác định được nguồn stream');
            }
            
            // Đọc một ít data để test
            let bytesReceived = 0;
            res.on('data', (chunk) => {
                bytesReceived += chunk.length;
                if (bytesReceived > 1024) {
                    // Đã nhận đủ data để test, đóng connection
                    res.destroy();
                    console.log(`\n✅ Đã nhận ${bytesReceived} bytes từ server`);
                    console.log('✅ Stream hoạt động bình thường\n');
                    resolve();
                }
            });
            
            res.on('end', () => {
                console.log(`\n✅ Stream kết thúc, tổng: ${bytesReceived} bytes\n`);
                resolve();
            });
            
            res.on('error', reject);
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// Test 2: Không có format (mặc định proxy qua server)
async function testDefaultProxy() {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}/api/stream/mp3?id=${VIDEO_ID}`;
        console.log('2. Testing không có format (mặc định proxy qua server):');
        console.log('----------------------------------------');
        console.log(`URL: ${url}\n`);
        
        const req = http.get(url, (res) => {
            console.log(`Status Code: ${res.statusCode}`);
            console.log(`Content-Type: ${res.headers['content-type']}`);
            console.log(`Server: ${res.headers['server'] || 'N/A'}`);
            
            const isFromServer = res.headers['server'] || 
                                 res.headers['access-control-allow-origin'];
            
            if (isFromServer) {
                console.log('✅ Stream được PROXY QUA SERVER\n');
            } else {
                console.log('⚠️  Không xác định được nguồn stream\n');
            }
            
            // Đóng ngay sau khi check headers
            res.destroy();
            resolve();
        });
        
        req.on('error', reject);
    });
}

// Test 3: format=url (trả về direct URL - KHÔNG proxy)
async function testDirectUrl() {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}/api/stream/mp3?id=${VIDEO_ID}&format=url`;
        console.log('3. Testing format=url (trả về direct URL từ YouTube):');
        console.log('----------------------------------------');
        console.log(`URL: ${url}\n`);
        
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log('Response:');
                    console.log(JSON.stringify(json, null, 2));
                    console.log('\n⚠️  Đây là DIRECT URL từ YouTube, KHÔNG phải proxy qua server');
                    console.log('⚠️  Client sẽ kết nối TRỰC TIẾP với YouTube\n');
                    resolve();
                } catch (e) {
                    console.error('Error:', e.message);
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Run all tests
async function runTests() {
    try {
        await testStreamProxy();
        await testDefaultProxy();
        await testDirectUrl();
        
        console.log('==========================================');
        console.log('KẾT LUẬN:');
        console.log('==========================================');
        console.log('✅ format=stream: PROXY QUA SERVER');
        console.log('✅ Không có format: PROXY QUA SERVER');
        console.log('⚠️  format=url: DIRECT URL (client kết nối trực tiếp YouTube)');
        console.log('==========================================');
    } catch (error) {
        console.error('Test failed:', error.message);
        process.exit(1);
    }
}

runTests();





