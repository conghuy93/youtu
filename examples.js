/**
 * Examples - Các ví dụ sử dụng YouTube MP3 API
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:6666';

// Example 1: Get video info
async function getVideoInfo() {
    console.log('=== Example 1: Get Video Info ===');
    try {
        const response = await axios.get(`${BASE_URL}/api/info?id=dQw4w9WgXcQ`);
        const data = response.data.data;
        
        console.log('Title:', data.title);
        console.log('Duration:', data.durationFormatted);
        console.log('Author:', data.author);
        console.log('Views:', data.viewCount);
        console.log('Thumbnail:', data.thumbnail);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Example 2: Search videos
async function searchVideos() {
    console.log('\n=== Example 2: Search Videos ===');
    try {
        const response = await axios.get(`${BASE_URL}/api/search?q=never%20gonna%20give%20you%20up&limit=5`);
        const videos = response.data.data;
        
        console.log(`Found ${videos.length} videos:`);
        videos.forEach((video, index) => {
            console.log(`${index + 1}. ${video.title} (${video.duration})`);
            console.log(`   ID: ${video.id}`);
            console.log(`   Channel: ${video.channel.name}`);
        });
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Example 3: Download MP3 (stream to file)
async function downloadMP3() {
    console.log('\n=== Example 3: Download MP3 ===');
    const fs = require('fs');
    const videoId = 'dQw4w9WgXcQ';
    
    try {
        const response = await axios.get(`${BASE_URL}/api/mp3?id=${videoId}`, {
            responseType: 'stream'
        });
        
        const writer = fs.createWriteStream('downloaded_song.mp3');
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log('✅ MP3 downloaded successfully!');
                console.log('File: downloaded_song.mp3');
                resolve();
            });
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Example 4: Get stats
async function getStats() {
    console.log('\n=== Example 4: Get Stats ===');
    try {
        const response = await axios.get(`${BASE_URL}/stats`);
        const stats = response.data;
        
        console.log('Uptime:', stats.uptime_seconds, 'seconds');
        console.log('Total requests:', stats.total_requests);
        console.log('Errors:', stats.errors);
        console.log('Downloads:', stats.downloads);
        console.log('Memory:', stats.memory_mb);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Run examples
async function runExamples() {
    await getVideoInfo();
    await searchVideos();
    // await downloadMP3(); // Uncomment to download
    await getStats();
}

// Uncomment to run
// runExamples().catch(console.error);

module.exports = {
    getVideoInfo,
    searchVideos,
    downloadMP3,
    getStats
};







