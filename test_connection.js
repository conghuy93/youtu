/**
 * Test YouTube API connection
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:6666';

async function testAPI() {
    console.log('=== Testing YouTube MP3 API ===\n');
    console.log(`Base URL: ${BASE_URL}\n`);
    
    // Test 1: Health check
    console.log('1. Testing health check...');
    try {
        const response = await axios.get(`${BASE_URL}/health`);
        console.log('   ✅ Health check OK');
        console.log('   Response:', response.data);
    } catch (error) {
        console.log('   ❌ Health check failed:', error.message);
        return;
    }
    
    // Test 2: Get video info
    console.log('\n2. Testing get video info...');
    try {
        const testVideoId = 'dQw4w9WgXcQ'; // Rick Roll
        const response = await axios.get(`${BASE_URL}/api/info?id=${testVideoId}`);
        console.log('   ✅ Get info OK');
        console.log('   Title:', response.data.data.title);
        console.log('   Duration:', response.data.data.durationFormatted);
    } catch (error) {
        console.log('   ❌ Get info failed:', error.message);
    }
    
    // Test 3: Search
    console.log('\n3. Testing search...');
    try {
        const response = await axios.get(`${BASE_URL}/api/search?q=never%20gonna%20give%20you%20up&limit=5`);
        console.log('   ✅ Search OK');
        console.log('   Results:', response.data.data.length);
        if (response.data.data.length > 0) {
            console.log('   First result:', response.data.data[0].title);
        }
    } catch (error) {
        console.log('   ❌ Search failed:', error.message);
    }
    
    // Test 4: Stats
    console.log('\n4. Testing stats...');
    try {
        const response = await axios.get(`${BASE_URL}/stats`);
        console.log('   ✅ Stats OK');
        console.log('   Total requests:', response.data.total_requests);
        console.log('   Uptime:', response.data.uptime_seconds, 'seconds');
    } catch (error) {
        console.log('   ❌ Stats failed:', error.message);
    }
    
    console.log('\n=== Test completed ===');
}

testAPI().catch(console.error);







